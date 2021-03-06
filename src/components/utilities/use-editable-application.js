import {
  useCallback, useEffect, useState, useMemo,
} from 'react';
import { useSettings } from '../use-settings';
import fetchMountsForPlaceholders from '../../models/parse-limit-mounts-placeholders-config';
import folderApplicationPublish from '../../models/folder-application-publish';
import folderApplicationUpdate from '../../models/folder-application-update';
import folderApplicationRemove from '../../models/folder-application-remove';
import useApplicationIcon from './use-application-icon';
import fetchFolderApplication from '../../models/folder-applications/fetch-folder-application';
import { useApplicationSession } from '../../models/validate-folder-application';

let newAttributeId = 0;

function getInfoFieldTitle(field, settings) {
  if (
    settings
    && settings.limitMountsPlaceholders
    && Object.prototype.hasOwnProperty.call(settings.limitMountsPlaceholders, field)) {
    return settings.limitMountsPlaceholders[field].title || field;
  }
  return field;
}

function getInfoFieldType(field, settings) {
  if (
    settings
    && settings.limitMountsPlaceholders
    && Object.prototype.hasOwnProperty.call(settings.limitMountsPlaceholders, field)) {
    return 'select';
  }
  if (field === 'instance') {
    return 'select';
  }
  if (field === 'source') {
    return 'source';
  }
  return 'text';
}

function getInfoFieldValuesPromise(field, settings) {
  if (
    settings
    && settings.limitMountsPlaceholders
    && Object.prototype.hasOwnProperty.call(settings.limitMountsPlaceholders, field)
  ) {
    const config = settings.limitMountsPlaceholders[field];
    return new Promise((resolve) => {
      fetchMountsForPlaceholders([{ config, placeholder: field }])
        .then((o) => {
          resolve((o[field] || []).map((storage) => storage.name));
        });
    });
  }
  if (field === 'instance' && settings.appConfigNodeSizes) {
    return Promise.resolve(Object.keys(settings.appConfigNodeSizes || {}));
  }
  return Promise.resolve([]);
}

export default function useEditableApplication(application) {
  const settings = useSettings();
  const [pending, setPending] = useState(true);
  const [name, setName] = useState(undefined);
  const [description, setDescription] = useState(undefined);
  const [fullDescription, setFullDescription] = useState(undefined);
  const [nameInitial, setNameInitial] = useState(undefined);
  const [descriptionInitial, setDescriptionInitial] = useState(undefined);
  const [fullDescriptionInitial, setFullDescriptionInitial] = useState(undefined);
  const [appIconPath, setAppIconPath] = useState(undefined);
  const [icon, setIcon] = useState(undefined);
  const [iconFile, setIconFile] = useState(undefined);
  const [initialSource, setInitialSource] = useState(undefined);
  const [infoFields, setInfoFields] = useState({});
  const [disabled, setDisabled] = useState(false);
  const [operation, setOperation] = useState(false);
  const [attributes, setNewAttributes] = useState([]);
  const [redistribute, setRedistribute] = useState(false);
  const [pathInfo, setPathInfo] = useState({});
  const [pathInfoInitial, setPathInfoInitial] = useState({});
  const [newOwnerInfo, setNewOwnerInfo] = useState(undefined);
  const setInfoField = useCallback((key, value) => {
    setInfoFields((o) => ({ ...o, [key]: value }));
  }, [setInfoFields]);
  const onChangeSource = useCallback((source) => {
    const appPath = source || initialSource;
    if (appPath && settings) {
      setDisabled(true);
      fetchFolderApplication(appPath, settings)
        .then((redistributeApplication) => {
          if (redistributeApplication) {
            const {
              iconFile: redistributeIconFile = {},
              name: redistributeName,
              description: redistributeDescription,
              fullDescription: redistributeFullDescription,
              info = {},
              pathInfo: redistributeApplicationPathInfo = {},
            } = redistributeApplication;
            setIcon(undefined);
            setIconFile(undefined);
            setAppIconPath(redistributeIconFile.path);
            setName(redistributeName);
            setDescription(redistributeDescription);
            setFullDescription(redistributeFullDescription);
            setNewAttributes([]);
            setPathInfo(redistributeApplicationPathInfo);
            setInfoFields((o) => ({

              ...Object.keys(o || {})
                .map((key) => ({
                  [key]: {
                    ...o[key],
                    value: info[key] || '',
                  },
                }))
                .reduce((r, c) => ({ ...r, ...c }), {}),
              source: {
                ...(o.source || {}),
                value: info?.path || o?.source?.value,
              },
            }));
          }
          setDisabled(false);
        });
    }
  }, [
    setDisabled,
    initialSource,
    settings,
    setName,
    setDescription,
    setFullDescription,
    setInfoField,
    setIcon,
    setIconFile,
    setPathInfo,
    setNewOwnerInfo,
  ]);
  const onChange = useCallback((key, value) => {
    if (/^name$/i.test(key)) {
      setName(value);
    } else if (/^description$/i.test(key)) {
      setDescription(value);
    } else if (/^fullDescription$/i.test(key)) {
      setFullDescription(value);
    } else if (/^ownerInfo$/i.test(key)) {
      setNewOwnerInfo(value);
    } else if (/^icon$/i.test(key)) {
      const fileReader = new FileReader();
      fileReader.onload = function onload() {
        setIcon(this.result);
        setIconFile(value);
      };
      fileReader.readAsDataURL(value);
    } else if (/^pathInfo$/i.test(key)) {
      setPathInfo(value);
    } else if (/^source$/i.test(key)) {
      onChangeSource(value);
    } else {
      setInfoFields((o) => ({

        ...o,
        [key]: {
          ...(o[key] || {}),
          value,
        },
      }));
    }
  }, [
    setName,
    setDescription,
    setFullDescription,
    setInfoField,
    setIcon,
    setIconFile,
    setPathInfo,
    setNewOwnerInfo,
    onChangeSource,
  ]);
  const onRedistribute = useCallback((value) => {
    if (!value) {
      setName(nameInitial);
      setDescription(descriptionInitial);
      setFullDescription(fullDescriptionInitial);
      setIconFile(undefined);
      setIcon(undefined);
      setAppIconPath(undefined);
      setPathInfo(pathInfoInitial);
      setNewOwnerInfo(undefined);
      setInfoFields((o) => ({

        ...Object.keys(o || {})
          .map((key) => ({
            [key]: {
              ...o[key],
              value: o[key].initialValue,
            },
          }))
          .reduce((r, c) => ({ ...r, ...c }), {}),
        ...Object.values(settings?.folderApplicationPathAttributes || {})
          .filter((pathKey) => !/^(name|user)$/i.test(pathKey))
          .map((pathKey) => ({
            [pathKey]: {
              ...(o[pathKey]),
              value: (o[pathKey] || {}).initialValue,
            },
          }))
          .reduce((r, c) => ({ ...r, ...c }), {}),
        source: {
          ...(o.source || {}),
          redistribute: false,
          value: (o.source || {}).initialValue,
        },
        user: {
          ...(o.user || {}),
          value: (o.user || {}).initialValue,
        },
      }));
    } else {
      setInfoFields((o) => ({

        ...o,
        source: {
          ...(o.source || {}),
          redistribute: true,
        },
      }));
      onChangeSource();
    }
    setRedistribute(!!value);
  }, [
    setAppIconPath,
    setInfoField,
    setRedistribute,
    setPathInfo,
    pathInfoInitial,
    settings,
    setNewOwnerInfo,
    onChangeSource,
    setName,
    setDescription,
    setFullDescription,
    nameInitial,
    descriptionInitial,
    fullDescriptionInitial,
    setIconFile,
    setIcon,
  ]);
  const addAttribute = useCallback(() => {
    newAttributeId += 1;
    setNewAttributes((o) => ([...(o || []), { id: newAttributeId }]));
  }, [setNewAttributes]);
  const removeAttribute = useCallback((attribute) => {
    setNewAttributes((o) => (o || []).filter((oo) => oo.id !== attribute.id));
  }, [setNewAttributes]);
  const onChangeAttribute = useCallback((attribute) => {
    setNewAttributes((o) => (o || []).map((oo) => (oo.id === attribute.id ? attribute : oo)));
  }, [setNewAttributes]);
  const isCommonAttributeName = useCallback((o) => /^\s*(name|description|ownerinfo|fullDescription)\s*$/i.test(o), []);
  const {
    icon: defaultIcon,
    clearCache,
  } = useApplicationIcon(
    application?.storage,
    appIconPath || application?.iconFile?.path,
  );
  useEffect(() => {
    if (application && settings) {
      const {
        name: appName,
        description: appDescription,
        fullDescription: appFullDescription,
        info = {},
        readOnlyAttributes = [],
        pathInfo: initialPathInfo = {},
      } = application;
      setName(appName);
      setNameInitial(appName);
      setDescription(appDescription);
      setDescriptionInitial(appDescription);
      setFullDescription(appFullDescription);
      setFullDescriptionInitial(appFullDescription);
      setNewAttributes([]);
      setPathInfo(initialPathInfo);
      setPathInfoInitial(initialPathInfo);
      const nodeSizes = Object.keys(settings.appConfigNodeSizes || {});
      const limitMountsPlaceholders = Object.keys(settings.limitMountsPlaceholders || {});
      setInfoFields(
        Object.keys({
          ...(
            nodeSizes.length > 0
              ? { instance: '' }
              : {}
          ),
          ...limitMountsPlaceholders.reduce((r, c) => ({ ...r, [c]: '' }), {}),
          ...info,
        })
          .filter((key) => !isCommonAttributeName(key))
          .reduce((r, c) => ({
            ...r,
            [c]: {
              title: getInfoFieldTitle(c, settings),
              value: info[c],
              initialValue: info[c],
              readOnly: readOnlyAttributes.includes(c),
              type: getInfoFieldType(c, settings),
              valuesPromise: getInfoFieldValuesPromise(c, settings),
            },
          }), {}),
      );
      setInitialSource(info?.source);
      setPending(false);
    }
  }, [
    settings,
    application,
    setName,
    setNameInitial,
    setDescription,
    setDescriptionInitial,
    setFullDescription,
    setFullDescriptionInitial,
    setNewAttributes,
    setInfoField,
    isCommonAttributeName,
    setPending,
    setPathInfo,
    setPathInfoInitial,
  ]);
  const isReservedName = useCallback((o) => {
    const names = Object.keys(infoFields || {})
      .concat(['name', 'description', 'fullDescription']);
    // eslint-disable-next-line no-useless-escape
    const regExp = new RegExp(`^\s*(${names.join('|')})\s*$`, 'i');
    return regExp.test(o);
  }, [infoFields]);
  const operationWrapper = useCallback((fn) => {
    const done = () => {
      setDisabled(false);
      setOperation(false);
    };
    if (fn && fn.then) {
      return new Promise((resolve, reject) => {
        fn
          .then(() => {
            done();
            resolve(true);
          })
          .catch((e) => {
            done();
            reject(e);
          });
      });
    }
    done();
    return Promise.resolve();
  }, [setDisabled, setOperation]);
  const publish = useCallback(() => {
    setDisabled(true);
    setOperation({
      name: !application.published || redistribute ? 'Publishing...' : 'Updating...',
    });
    const applicationInfo = {
      source: application?.info?.source || application?.info?.path,
      ownerInfo: application?.info?.ownerInfo,
      ...(
        Object.entries(infoFields)
          .filter(([, { value, readOnly }]) => value !== '' && value !== 'undefined' && !readOnly)
          .map(([key, { value }]) => ({ [key]: value }))
          .reduce((r, c) => ({ ...r, ...c }), {})
      ),
      ...(
        attributes
          .map((attribute) => ({ [attribute.name]: attribute.value }))
          .reduce((r, c) => ({ ...r, ...c }), {})
      ),
      name,
      description,
      fullDescription,
      user: infoFields?.user?.value || application?.info?.user,
    };
    const appPayload = {
      ...application,
      info: {
        ...(application.info || {}),
      },
    };
    if (redistribute) {
      applicationInfo.source = infoFields.source?.value || applicationInfo.source;
      appPayload.info.source = infoFields.source?.value || appPayload.info.source;
      appPayload.pathInfo = pathInfo || pathInfoInitial;
      appPayload.info.ownerInfo = newOwnerInfo || appPayload.info.ownerInfo;
      applicationInfo.ownerInfo = newOwnerInfo || appPayload.info.ownerInfo;
    }
    if (iconFile) {
      clearCache();
    }
    const progressCallback = (details, progress) => setOperation((o) => ({
      name: o.name,
      details,
      progress: progress || o.progress,
    }));
    const action = !application.published || redistribute
      ? folderApplicationPublish
      : folderApplicationUpdate;
    return operationWrapper(
      action(settings, appPayload, applicationInfo, iconFile, true, progressCallback),
    );
  }, [
    settings,
    application,
    setDisabled,
    infoFields,
    attributes,
    name,
    description,
    fullDescription,
    setOperation,
    iconFile,
    redistribute,
    clearCache,
    setPathInfo,
    pathInfo,
    pathInfoInitial,
    newOwnerInfo,
    operationWrapper,
  ]);
  const applicationPayload = useMemo(() => {
    const applicationInfo = {
      source: application?.info?.source || application?.info?.path,
      ownerInfo: application?.info?.ownerInfo,
      ...(
        Object.entries(infoFields)
          .filter(([, { value, readOnly }]) => value !== '' && value !== 'undefined' && !readOnly)
          .map(([key, { value }]) => ({ [key]: value }))
          .reduce((r, c) => ({ ...r, ...c }), {})
      ),
      ...(
        attributes
          .map((attribute) => ({ [attribute.name]: attribute.value }))
          .reduce((r, c) => ({ ...r, ...c }), {})
      ),
      name,
      description,
      fullDescription,
      user: infoFields?.user?.value || application?.info?.user,
    };
    const appPayload = {
      ...application,
      info: {
        ...(application.info || {}),
      },
    };
    if (redistribute) {
      applicationInfo.source = infoFields.source?.value || applicationInfo.source;
      appPayload.info.source = infoFields.source?.value || appPayload.info.source;
      appPayload.pathInfo = pathInfo || pathInfoInitial;
      appPayload.info.ownerInfo = newOwnerInfo || appPayload.info.ownerInfo;
      applicationInfo.ownerInfo = newOwnerInfo || appPayload.info.ownerInfo;
    }
    return appPayload;
  }, [
    application,
    infoFields,
    attributes,
    name,
    description,
    fullDescription,
    redistribute,
    pathInfo,
    pathInfoInitial,
    newOwnerInfo,
  ]);
  const remove = useCallback(() => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to remove application?')) {
      setDisabled(true);
      setOperation({ name: 'Removing...' });
      const progressCallback = (details, progress) => setOperation((o) => ({
        name: o.name,
        details: details || o.details,
        progress: progress || o.progress,
      }));
      return operationWrapper(
        folderApplicationRemove(application, settings, progressCallback),
      );
    }
    return Promise.resolve(false);
  }, [settings, application, setDisabled, setOperation, operationWrapper]);
  const { session, validate, stopValidation } = useApplicationSession(applicationPayload);
  return {
    info: {
      name,
      description,
      fullDescription,
      infoFields,
      icon: icon || defaultIcon,
      attributes,
    },
    disabled: disabled || (session && session.pending),
    addAttribute,
    removeAttribute,
    onChange,
    onRedistribute,
    onChangeAttribute,
    publish,
    remove,
    isReservedName,
    pending,
    operation,
    applicationPayload,
    validate,
    stopValidation,
    validation: session,
  };
}
