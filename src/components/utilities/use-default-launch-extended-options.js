import {
  useEffect,
  useState,
} from 'react';
import appendOptionsValue from './append-options-value';

export default function useDefaultLaunchExtendedSettings(appExtendedSettings) {
  const [options, setOptions] = useState({});
  useEffect(() => {
    if (appExtendedSettings) {
      const result = {};
      for (let s = 0; s < appExtendedSettings.length; s += 1) {
        const setting = appExtendedSettings[s];
        if (setting.default) {
          appendOptionsValue(result, setting.optionsField, setting.default);
        }
      }
      setOptions(result);
    }
  }, [setOptions, appExtendedSettings]);
  return [
    options,
    setOptions,
  ];
}
