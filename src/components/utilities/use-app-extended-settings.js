import {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ExtendedSettingsContext } from './use-extended-settings';
import appendOptionsValue from './append-options-value';
import readOptionsValue from './read-options-value';

function getKey(key) {
  return `gateway-launch-options-${key}`;
}

function getLocalStorageValue(key) {
  try {
    return JSON.parse(localStorage.getItem(getKey(key)) || '{}');
  } catch (_) {
    return {};
  }
}

function setLocalStorageValue(key, value) {
  localStorage.setItem(getKey(key), JSON.stringify(value));
}

export default function useAppExtendedSettings(application) {
  const appExtendedSettings = useContext(ExtendedSettingsContext);
  const [options, setOptions] = useState({});
  useEffect(() => {
    if (application && appExtendedSettings) {
      const opts = {};
      for (let s = 0; s < appExtendedSettings.length; s += 1) {
        const setting = appExtendedSettings[s];
        const { key } = setting;
        const storageValue = getLocalStorageValue(key);
        if (Object.prototype.hasOwnProperty.call(storageValue, application.id)) {
          appendOptionsValue(opts, setting.optionsField, storageValue[application.id]);
        }
      }
      setOptions(opts);
    }
  }, [application, appExtendedSettings, setOptions]);
  const save = useCallback((opts) => {
    if (application && appExtendedSettings) {
      for (let s = 0; s < appExtendedSettings.length; s += 1) {
        const setting = appExtendedSettings[s];
        const { key } = setting;
        const value = readOptionsValue(opts, setting.optionsField);
        const storageValue = getLocalStorageValue(key);
        storageValue[application.id] = value;
        setLocalStorageValue(key, storageValue);
      }
    }
  }, [application, appExtendedSettings]);
  const onChange = useCallback((setting, value, saveLocal = false) => {
    if (setting && options) {
      const newOptions = { ...appendOptionsValue(options, setting.optionsField, value) };
      setOptions(newOptions);
      if (saveLocal) {
        save(newOptions);
      }
    }
  }, [appendOptionsValue, options, setOptions, save]);
  const getSettingValue = useCallback((setting) => {
    if (setting) {
      return readOptionsValue(options, setting.optionsField);
    }
    return undefined;
  }, [options, readOptionsValue()]);
  const appendDefault = useCallback((opts) => {
    const result = { ...opts };
    for (let s = 0; s < appExtendedSettings.length; s += 1) {
      const setting = appExtendedSettings[s];
      if (setting.default && readOptionsValue(result, setting.optionsField) === undefined) {
        appendOptionsValue(result, setting.optionsField, setting.default);
      }
    }
    return result;
  }, [appExtendedSettings]);
  return {
    appendDefault,
    getSettingValue,
    onChange,
    options,
    save,
  };
}
