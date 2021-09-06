import React, {useEffect, useMemo, useState} from 'react';
import {useSettings} from '../use-settings';
import fetchMountsForPlaceholders from '../../models/parse-limit-mounts-placeholders-config';

const ExtendedSettingsContext = React.createContext({});
export {ExtendedSettingsContext};

export default function useExtendedSettings () {
  const settings = useSettings();
  const [placeholdersMounts, setPlaceholderMounts] = useState({});
  const placeholders = (settings?.limitMounts || '')
    .split(',')
    .filter(o => Number.isNaN(Number(o)))
    .filter(o => !/^(default|user_default_storage|current_user_default_storage)$/.test(o))
    .map(placeholder => ({
      placeholder,
      config: settings?.limitMountsPlaceholders
        ? settings.limitMountsPlaceholders[placeholder]
        : undefined
    }))
    .filter(o => !!o.config);
  useEffect(() => {
    if (placeholders.length > 0) {
      fetchMountsForPlaceholders(placeholders)
        .then(setPlaceholderMounts);
    }
  }, [settings]);
  return useMemo(() => {
    const extendedSettings = [];
    if (settings?.appConfigNodeSizes) {
      const nodeSizes = Object.keys(settings?.appConfigNodeSizes || {});
      if (nodeSizes.length > 0) {
        extendedSettings.push({
          key: 'node-size',
          title: 'Size',
          type: 'radio',
          values: nodeSizes,
          required: false,
          optionsField: 'nodeSize',
          valuePresentation: (o => o)
        });
      }
    }
    placeholders.forEach(placeholder => {
      const {
        placeholder: name,
        config = {}
      } = placeholder;
      const mounts = placeholdersMounts[name] || [];
      if (mounts.length > 0) {
        const title = config.title || name;
        extendedSettings.push({
          key: `limit-mounts-placeholder-${name}`,
          title,
          type: 'radio',
          default: Number(config.default),
          values: mounts,
          itemName: storage => storage.name,
          itemValue: storage => storage.id,
          required: false,
          optionsField: `limitMountsPlaceholders.${name}`,
          valuePresentation(id) {
            const itemValue = this.itemValue;
            const item = (this.values || []).find(i => itemValue(i) === id);
            if (item) {
              return this.itemName(item);
            }
            return id;
          }
        });
      }
    });
    return extendedSettings;
  }, [settings, placeholdersMounts]);
}
