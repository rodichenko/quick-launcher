import React, {
  useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import moment from 'moment-timezone';
import removeExtraSlash from '../utilities/remove-slashes';
import getRun from '../cloud-pipeline-api/run';
import startValidationJob from './start-validation-job';
import stopRun from '../cloud-pipeline-api/stop-run';
import parseRunServiceUrl from '../cloud-pipeline-api/utilities/parse-run-service-url';
import buildApplicationPath from './build-application-path';
import checkApplication from './check-application';
import getUserToken from '../cloud-pipeline-api/user-token';

const KEY = 'validations';
const VALIDATION_POLLING_INTERVAL_MS = 2500;

function getLocalDateTime(unix) {
  return moment(unix).format('D MMMM, YYYY, HH:mm');
}

function getExpirationDate(date, expiration) {
  const r = /([\d]+)(m|d|h)/g;
  const expirationInfo = {
    d: 0,
    m: 0,
    h: 0,
  };
  let e = r.exec(expiration);
  while (e && e.length === 3) {
    expirationInfo[e[2]] += (+e[1]);
    e = r.exec(expiration);
  }
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const expirationSeconds = expirationInfo.m * minute
    + expirationInfo.h * hour
    + expirationInfo.d * day;
  return date + expirationSeconds * 1000;
}

function getApplicationPath(application) {
  const storage = application?.storage;
  const path = removeExtraSlash(application?.info?.source || application?.info?.path);
  return { storage, path };
}

const colorLog = (color, ...opts) => {
  if (opts.length > 0) {
    console.log(
      `%c${opts.join(' ')}`,
      `color: ${color}`,
    );
  }
};

const log = (...opts) => colorLog('green', ...opts);
const logError = (...opts) => colorLog('red', ...opts);

function FAValidationSession(info, sessions) {
  const {
    storage,
    path,
    id,
    status,
    jobStatus = 'running',
    initialized,
    endpoint,
    timestamp,
    stopped,
    ...rest
  } = info;
  return {
    storage,
    path,
    id,
    status,
    initialized,
    endpoint,
    timestamp,
    jobStatus,
    stopped,
    ...rest,
    update() {
      this.timestamp = new Date().getTime();
      sessions.updateTimestamp();
    },
    validationLog(...opts) {
      log(...[`Validating application ${this.path}:`, ...opts]);
    },
    validationErrorLog(...opts) {
      logError(...[`Validating application ${this.path} error:`, ...opts]);
    },
    remove() {
      if (this.removed) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        this.validationLog('removing local storage item');
        this.stop()
          .then((stopResult) => {
            this.removed = stopResult;
            resolve(stopResult);
          });
      });
    },
    stop() {
      if (this.stopped) {
        return Promise.resolve(this.stopped);
      }
      this.update();
      if (!this.stopping) {
        this.validationLog('stopping job...');
        this.stopping = new Promise((resolve) => {
          stopRun(this.id)
            .then((result) => {
              const { status: requestStatus, message } = result;
              if (requestStatus === 'OK') {
                this.stopped = true;
                this.status = /^pending$/i.test(this.status) ? undefined : this.status;
                this.validationLog('job stopped');
              } else {
                throw new Error(message || requestStatus);
              }
            })
            .catch((e) => {
              this.validationErrorLog(e.message);
            })
            .then(() => this.update())
            .then(() => {
              this.stopping = undefined;
              resolve(this.stopped);
            });
        });
      }
      return this.stopping;
    },
    startValidation(application) {
      this.status = 'pending';
      this.update();
      return new Promise((resolve) => {
        this.validationLog('started');
        const logCb = this.validationLog.bind(this);
        startValidationJob(
          application,
          {
            log: logCb,
          },
        )
          .then((startResult) => {
            const {
              error,
              run,
            } = startResult;
            if (error) {
              throw new Error(error);
            }
            if (run) {
              const {
                id: runId,
                status: runStatus,
                serviceUrl,
                initialized: runInitialized = false,
              } = run;
              this.validationLog('job received:', `#${runId}`);
              this.id = runId;
              this.jobStatus = runStatus;
              this.initialized = runInitialized;
              const endpoints = parseRunServiceUrl(serviceUrl) || [];
              const runEndpoint = endpoints.find((e) => e.isDefault) || endpoints[0];
              this.endpoint = runEndpoint ? runEndpoint.url : undefined;
              return this.validate();
            }
            throw new Error('missing job identifier');
          })
          .catch((e) => {
            this.error = e.message;
            this.status = 'error';
            this.validationErrorLog(e.message);
          })
          .then(() => this.update())
          .then(resolve);
      });
    },
    getJobInfo() {
      return new Promise((resolve, reject) => {
        if (this.initialized && /^running$/i.test(this.jobStatus) && this.endpoint) {
          resolve({
            initialized: this.initialized,
            endpoint: this.endpoint,
            jobStatus: this.jobStatus,
          });
        } else {
          this.validationLog(`polling job #${this.id}...`);
          getRun(this.id)
            .then((run) => {
              const { status: requestStatus, message, payload: runInfo } = run;
              if (requestStatus === 'OK' && runInfo) {
                const {
                  status: runStatus,
                  serviceUrl,
                  initialized: runInitialized,
                } = runInfo;
                const endpoints = parseRunServiceUrl(serviceUrl) || [];
                const runEndpoint = endpoints.find((e) => e.isDefault) || endpoints[0];
                const endpointUrl = runEndpoint ? runEndpoint.url : undefined;
                this.validationLog(`job #${this.id} status: ${runStatus}; initialized: ${runInitialized}; service url received: ${endpointUrl || 'none'}`);
                resolve({
                  jobStatus: runStatus,
                  endpoint: endpointUrl,
                  initialized: runInitialized,
                });
              } else {
                throw new Error(message || requestStatus);
              }
            })
            .catch(reject);
        }
      });
    },
    checkApplication() {
      return new Promise((resolve, reject) => {
        this.validationLog('calling job endpoint to check application...');
        Promise.all([
          buildApplicationPath(this.storage, this.path, sessions.settings),
          getUserToken(),
        ])
          .then(([absolutePath, token]) => {
            this.validationLog(`target_folder=${absolutePath}`);
            return checkApplication(this.endpoint, absolutePath, token);
          })
          .then((checkResult) => {
            this.validationLog(`check result: ${JSON.stringify(checkResult)}`);
            const {
              is_valid: isValid = false,
              message,
            } = checkResult || {};
            this.status = isValid ? 'valid' : 'error';
            this.error = isValid ? undefined : (message || 'unknown');
            return this.stop();
          })
          .then(() => resolve(this.valid))
          .catch(reject);
      });
    },
    validate(force = false) {
      if (!force && !this.pending) {
        return Promise.resolve(this.status);
      }
      if (this.removing || this.removed || this.stopping || this.stopped || !this.id) {
        return Promise.resolve(this.status);
      }
      if (force) {
        this.validating = undefined;
      }
      if (!this.validating) {
        this.status = 'pending';
        this.update();
        this.validating = new Promise((resolve) => {
          this.getJobInfo()
            .then((runInfo) => {
              const {
                jobStatus: runStatus,
                initialized: runInitialized,
                endpoint: runEndpoint,
              } = runInfo;
              this.jobStatus = runStatus;
              this.initialized = runInitialized;
              this.endpoint = runEndpoint;
              this.error = undefined;
              if (/^(stopped|failure)$/i.test(jobStatus)) {
                throw new Error('job stopped');
              } else if (/^(paused)$/i.test(jobStatus)) {
                this.validationLog('job is paused. stopping it');
                this.status = 'invalid';
                return this.stop();
              } else if (/^running$/i.test(jobStatus) && !!endpoint && initialized) {
                this.validationLog('endpoint available');
                this.status = 'pending';
                return this.checkApplication();
              } else {
                this.status = 'pending';
                return Promise.resolve();
              }
            })
            .catch((e) => {
              this.error = e.message;
              this.status = 'error';
              logError(`Validating application ${this.path} error: ${e.message}`);
              return this.stop();
            })
            .then(() => this.update())
            .then(() => {
              this.validating = undefined;
              resolve();
            });
        });
      }
      return this.validating;
    },
    get valid() {
      return /^valid$/i.test(this.status);
    },
    get pending() {
      return !this.stopped && !/^(valid|error)$/i.test(this.status);
    },
    get info() {
      return `Session #${this.id}: ${path}, validation status: ${status}${this.expired ? '. EXPIRED' : ''}`;
    },
    get expired() {
      if (
        sessions.settings
        && sessions.settings.folderApplicationValidation
        && sessions.settings.folderApplicationValidation.expiresAfter
      ) {
        return getExpirationDate(
          this.timestamp,
          sessions.settings.folderApplicationValidation.expiresAfter,
        ) < (new Date()).getTime();
      }
      return false;
    },
    get data() {
      return {
        storage: this.storage,
        path: this.path,
        id: this.id,
        status: this.status,
        timestamp: this.timestamp,
        error: this.error,
        stopped: this.stopped,
      };
    },
  };
}

function Sessions(settings) {
  this.settings = settings;
  try {
    this.sessions = JSON.parse(localStorage.getItem(KEY))
      .filter((o) => !!o.id)
      .map((o) => new FAValidationSession(o, this));
  } catch (_) {
    this.sessions = [];
  }
  this.printSessions = function printSessions() {
    log('================================================');
    log('Folder application validation sessions:', this.sessions.length);
    this.sessions.forEach((session) => {
      log(session.info);
    });
    log('================================================');
  };
  this.save = function save() {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        this.sessions
          .filter((session) => !session.removed && !session.expired)
          .map((session) => session.data),
      ),
    );
  };
  this.listeners = [];
  this.removeListener = function removeListener(listener) {
    this.listeners.splice(this.listeners.indexOf(listener), 1);
  };
  this.addListener = function addListener(listener) {
    this.listeners.push(listener);
    return this.removeListener.bind(this, listener);
  };
  this.updateTimestamp = function updateTimestamp() {
    this.timestamp = new Date().getTime();
    this.listeners.forEach((cb) => cb(this.timestamp));
  };
  this.updateTimestamp();
  this.validate = function validate() {
    clearTimeout(this.active);
    Promise.all(this.sessions.map((session) => session.validate()))
      .then(() => {
        this.active = setTimeout(
          this.validate.bind(this),
          settings?.folderApplicationValidation?.pollingIntervalMS
          || VALIDATION_POLLING_INTERVAL_MS,
        );
        this.save();
      });
  };
  this.start = function start() {
    if (this.active) {
      return;
    }
    this.settings = settings;
    log('Start watching folder application sessions');
    this.printSessions();
    this.validate();
  };
  this.finish = function finish() {
    log('Stop watching folder application sessions');
    this.printSessions();
    clearTimeout(this.active);
    this.active = undefined;
  };
  this.findSession = function findSession(storage, path) {
    return this.sessions.find((session) => !session.removed
      && !session.expired
      && `${session.storage}` === `${storage}`
      && session.path === path);
  };
  this.getSessionForApplication = function getSessionForApplication(application) {
    if (!application) {
      return undefined;
    }
    const { path, storage } = getApplicationPath(application);
    return this.findSession(storage, path);
  };
  this.validateApplication = function validateApplication(application) {
    const { path, storage } = getApplicationPath(application);
    const currentSession = this.findSession(storage, path);
    const removeCurrentJob = () => new Promise((resolve) => {
      if (currentSession) {
        currentSession.remove()
          .then(resolve);
      } else {
        resolve();
      }
    });
    return new Promise((resolve) => {
      removeCurrentJob()
        .then(() => this.save())
        .then(() => {
          const session = new FAValidationSession({ storage, path }, this);
          this.sessions.push(session);
          this.save();
          return session.startValidation(application);
        })
        .then(resolve);
    });
  };
}

const FAValidationSessionsContext = React.createContext();

export function useSessions(settings) {
  const [sessions, setSessions] = useState(undefined);
  useEffect(() => {
    if (settings) {
      const newSessions = new Sessions(settings);
      newSessions.start();
      setSessions(newSessions);
      return newSessions.finish.bind(sessions);
    }
    return () => {};
  }, [settings]);
  return sessions;
}

export function useApplicationSession(application) {
  const sessions = useContext(FAValidationSessionsContext);
  const [timeStamp, setTimeStamp] = useState(0);
  const [session, setSession] = useState(undefined);
  const [pending, setPending] = useState(false);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState(false);
  const [validationDate, setValidationDate] = useState(undefined);
  useEffect(() => {
    if (sessions) {
      return sessions.addListener(setTimeStamp);
    }
    return () => {};
  }, [sessions, setTimeStamp]);
  useEffect(() => {
    const appSession = sessions?.getSessionForApplication(application);
    setValid(appSession?.valid);
    setPending(appSession?.pending);
    setError(appSession?.error);
    setValidationDate(appSession?.timestamp);
    setSession(appSession);
  }, [application, sessions, timeStamp, setValidationDate]);
  const validate = useCallback(() => {
    if (sessions) {
      sessions
        .validateApplication(application)
        .then(setSession);
    }
  }, [application, sessions, setSession]);
  const stopValidation = useCallback(() => {
    if (session) {
      session.remove();
    }
  }, [session]);
  const sessionInfo = useMemo(() => ({
    valid,
    pending,
    error,
    validated: !!session,
    validatedAt: session && validationDate
      ? getLocalDateTime(validationDate)
      : undefined,
  }), [valid, pending, error, session, validationDate]);
  return useMemo(() => ({
    session: sessionInfo,
    validate,
    stopValidation: session && session.id ? stopValidation : undefined,
  }), [session, sessionInfo, validate, stopValidation]);
}

export { FAValidationSessionsContext };
