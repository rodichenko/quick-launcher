import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import PropTypes from 'prop-types';
import LoadingIndicator from './shared/loading-indicator';
import { ApplicationsContext, UserContext } from './use-applications';
import { SettingsContext } from './use-settings';
import Timer from './timer';
import launchApplication from '../models/launch-application';
import stopApplication from '../models/stop';
import stopRun from '../models/cloud-pipeline-api/stop-run';
import fetchSettings from '../models/base/settings';
import combineUrl from '../models/base/combine-url';
import processString from '../models/process-string';
import { StopRunsError } from '../models/find-user-run';
import './components.css';
import useEnterKey from '../helpers/use-enter-key';

function stopJobs(runs = []) {
  const wrapStopRun = (run) => new Promise((resolve, reject) => {
    stopRun(run.id)
      .then((payload) => {
        if (payload.status === 'OK') {
          return resolve();
        }
        throw new Error(`Error stopping job${payload.message ? ': ' : '.'}${payload.message})`);
      })
      .catch(reject);
  });
  return new Promise((resolve, reject) => {
    Promise.all(runs.map(wrapStopRun))
      .then(() => {
        resolve();
      })
      .catch(reject);
  });
}

function getRedirectUrl(run, settings, options) {
  if (/^custom$/i.test(settings?.redirectBehavior)) {
    if (settings?.redirectUrl) {
      return processString(settings?.redirectUrl, options);
    }
    console.warn('Redirect behavior is set to "CUSTOM", but "redirectUrl" was not specified in settings. Default redirect behavior will be used');
  }
  if (options && options.redirectPathName) {
    return combineUrl(run.url, options.redirectPathName);
  }
  return run.url;
}

function useLaunch(application, user, options) {
  const [url, setUrl] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [runId, setRunId] = useState(undefined);
  const [stopRuns, setStopRuns] = useState(undefined);
  const [polling, setPolling] = useState(0);
  const [retry, setRetry] = useState(0);
  const reLaunch = useCallback(() => {
    setUrl(undefined);
    setError(undefined);
    setRunId(undefined);
    setStopRuns(undefined);
    setPolling(0);
    setRetry((o) => o + 1);
  }, [
    setUrl,
    setError,
    setRunId,
    setStopRuns,
    setPolling,
    setRetry,
  ]);
  useEffect(() => {
    if (application) {
      console.log('Launching application', application.name, `(${user?.userName})`);
      if (options) {
        console.log('Launching options:', options);
      }
    }
  }, [application, user]);
  useEffect(() => {
    if (application && user && !error && !url) {
      let timeout;
      fetchSettings()
        .then((settings) => {
          launchApplication(application, user, options)
            .then((info) => {
              if (info && info.error) {
                setError(info.error);
              } else if (info && /^ready$/i.test(info.status) && info.url) {
                setUrl(getRedirectUrl(info, settings, options));
              } else {
                if (info.run) {
                  setRunId(info.run.id);
                }
                let interval = polling === 0
                  ? (settings?.initialPollingDelay || settings?.pollingInterval)
                  : settings?.pollingInterval;
                const DEFAULT_INTERVAL_MS = 5000;
                if (polling < 2) {
                  if (interval) {
                    console.log('Polling interval:', interval, 'ms');
                  } else {
                    console.log('Polling interval is not set. Default interval will be used:', DEFAULT_INTERVAL_MS, 'ms');
                  }
                }
                interval = interval || DEFAULT_INTERVAL_MS;
                timeout = setTimeout(setPolling, interval, (o) => o + 1);
              }
            })
            .catch((e) => {
              console.error(e);
              setError(e.message);
              if (e instanceof StopRunsError) {
                setStopRuns(e);
              }
            });
        });
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
    return undefined;
  }, [
    polling,
    setPolling,
    application,
    user,
    setUrl,
    url,
    error,
    setError,
    options,
    setRunId,
    retry,
  ]);
  useEffect(() => {
    if (url) {
      console.log('Redirecting', url);
      window.location = url;
    }
  }, [url]);
  return {
    url,
    launchError: error,
    runId,
    stopRuns,
    reLaunch,
  };
}

function useStopLaunch(application, user) {
  useEffect(() => {
    if (application && user) {
      return () => {
        console.log('Stopping application', application.name, `(${user?.userName})`);
        stopApplication(application, user)
          .then(() => {
            console.log('Application stopped', application.name, `(${user?.userName})`);
          })
          .catch(console.error);
      };
    }
    return () => {};
  }, [application, user]);
}

function Application({
  id: applicationId, name: appName, launchOptions, goBack,
}) {
  const applications = useContext(ApplicationsContext);
  const user = useContext(UserContext);
  const [application] = (applications || []).filter((a) => a.id === applicationId);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState(undefined);
  const {
    url,
    launchError,
    runId,
    stopRuns: stopRunsError,
    reLaunch,
  } = useLaunch(application, user, launchOptions);
  const stopRunsAndReLaunch = useCallback(() => {
    if (stopRunsError && stopRunsError.runs && stopRunsError.runs.length) {
      setStopping(true);
      stopJobs(stopRunsError.runs)
        .then(() => {
          reLaunch();
        })
        .catch((e) => {
          setError(e.message);
        })
        .then(() => {
          setStopping(false);
        });
    } else {
      reLaunch();
    }
  }, [stopJobs, stopRunsError, reLaunch, setStopping]);
  const settings = useContext(SettingsContext);
  useStopLaunch(application, user);
  const goBackKeyPress = useEnterKey(goBack);
  const stopRunsAndReLaunchKeyPress = useEnterKey(stopRunsAndReLaunch);
  if (!application) {
    return (
      <div className="content error">
        <div className="header">
          Application
          {' '}
          {applicationId}
          {' '}
          not found
        </div>
        <div className="description">
          Please, contact
          {' '}
          {settings?.supportName || 'support team'}
          {' '}
          for details.
        </div>
      </div>
    );
  }
  let content;
  const timer = (
    <Timer
      className="timer"
      enabled={settings?.showTimer && !launchError && runId}
    />
  );
  if (url) {
    content = (
      <div className="content">
        <LoadingIndicator style={{ marginRight: 5, width: 15, height: 15 }} />
        <span>
          Opening
          {appName || application.name}
          ...
        </span>
      </div>
    );
  } else if (error) {
    content = (
      <div className="content error">
        <div className="header">
          Error stopping jobs
        </div>
        <div className="description">
          Please, contact
          {' '}
          {settings?.supportName || 'support team'}
          {' '}
          for details.
          {' '}
          <br />
          <span className="raw">{error}</span>
        </div>
      </div>
    );
  } else if (stopping) {
    content = (
      <div className="content loading">
        <LoadingIndicator style={{ marginRight: 5, width: 15, height: 15 }} />
        <span>Stopping jobs...</span>
      </div>
    );
  } else if (stopRunsError) {
    const {
      runs,
      options,
    } = stopRunsError;
    let reason = 'using different parameters';
    if (options && options.nodeSize) {
      reason = 'using different node size';
    } else if (options && options.placeholders && options.placeholders.length) {
      reason = (
        <span>
          <span>using different</span>
          <span
            style={{
              fontFamily: 'monospace',
              color: '#ffffff',
              marginLeft: 5,
            }}
          >
            {options.placeholders.join(', ')}
          </span>
        </span>
      );
    }
    content = (
      <div
        className="content stop-run"
      >
        <div
          className="description"
        >
          There
          {' '}
          {runs.length > 1 ? 'are' : 'is a'}
          {' '}
          running job
          {runs.length > 1 ? 's' : ''}
          {' '}
          {reason}
          .
          <br />
          It shall be stopped before running a new instance.
        </div>
        <div
          className="description"
          style={{ color: '#aaaaaa', fontSize: 'smaller' }}
        >
          Stop current job
          {runs.length > 1 ? 's' : ''}
          {' '}
          and run a new one?
        </div>
        <div
          className="stop-run-actions"
        >
          <div
            role="button"
            tabIndex={0}
            className="button"
            onClick={goBack}
            onKeyPress={goBackKeyPress}
          >
            CANCEL
          </div>
          <div
            role="button"
            tabIndex={0}
            className="button"
            onClick={stopRunsAndReLaunch}
            onKeyPress={stopRunsAndReLaunchKeyPress}
          >
            OK
          </div>
        </div>
      </div>
    );
  } else if (launchError) {
    content = (
      <div className="content error">
        <div className="header">
          Error launching
          {' '}
          {appName || application.name}
        </div>
        <div className="description">
          Please, contact
          {' '}
          {settings?.supportName || 'support team'}
          {' '}
          for details.
          {' '}
          <br />
          <span className="raw">{launchError}</span>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="content loading">
        <LoadingIndicator style={{ marginRight: 5, width: 15, height: 15 }} />
        <span>
          Launching
          {appName || application.name}
          ...
        </span>
      </div>
    );
  }
  return (
    <div className="app-info">
      <div className="header">
        {
          application.icon && (
            <img
              src={application.icon}
              alt={appName || application.name}
              className="icon"
            />
          )
        }
        {
          !application.icon && application.iconData && (
            <img
              src={application.iconData}
              alt={appName || application.name}
              className="icon"
            />
          )
        }
        <span className="name">{appName || application.name}</span>
        <span className="version">{application.version}</span>
      </div>
      {content}
      {timer}
    </div>
  );
}

Application.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  launchOptions: PropTypes.object,
  goBack: PropTypes.func,
};

Application.defaultProps = {
  id: undefined,
  name: undefined,
  launchOptions: {},
  goBack: undefined,
};

export default Application;
