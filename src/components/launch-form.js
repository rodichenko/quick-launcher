import React, {useCallback, useContext, useState} from 'react';
import classNames from 'classnames';
import './components.css';
import {ExtendedSettingsContext} from "./utilities/use-extended-settings";
import useAppExtendedSettings from './utilities/use-app-extended-settings';

function Selection(
  {
    config,
    value,
    onChange = (() => {})
  }
) {
  if (!config) {
    return null;
  }
  const {
    values = [],
    itemValue = (o => o),
    itemName = (o => o)
  } = config;
  if (!values.length) {
    return null;
  }
  const handleClick = item => e => {
    e && e.preventDefault();
    e && e.stopPropagation();
    const isSelected = itemValue(item) === value;
    if (isSelected && !config.required) {
      onChange && onChange(undefined);
    } else {
      onChange && onChange(itemValue(item));
    }
  };
  return (
    <>
      {
        values.map(item => (
          <div
            key={itemValue(item)}
            className={
              classNames(
                'value',
                {
                  selected: itemValue(item) === value
                }
              )
            }
            onClick={handleClick(item)}
          >
            {itemName(item)}
          </div>
        ))
      }
    </>
  );
}

function SettingValue({config, value, onChange}) {
  if (!config) {
    return null;
  }
  if (/^radio$/i.test(config.type)) {
    return (
      <Selection
        config={config}
        value={value}
        onChange={onChange}
      />
    );
  }
  return null;
}

export default function LaunchForm(
  {
    application,
    onLaunch
  },
) {
  const appExtendedSettings = useContext(ExtendedSettingsContext);
  const {
    appendDefault,
    getSettingValue,
    onChange,
    options,
    save
  } = useAppExtendedSettings(application);
  const onLaunchClicked = useCallback(() => {
    save(options);
    onLaunch && onLaunch(appendDefault(options));
  }, [options, save, onLaunch, appendDefault]);
  return (
    <div className={classNames('app-launch-form', {dark: DARK_MODE})}>
      <div className="header">
        {
          application.icon && (
            <img
              src={application.icon}
              alt={application.name}
              className="icon"
            />
          )
        }
        {
          !application.icon && application.iconData && (
            <img
              src={application.iconData}
              alt={application.name}
              className="icon"
            />
          )
        }
        <span className="name">
          {application.name}
        </span>
        {
          application.version && (
            <span className="version">
              {application.version}
            </span>
          )
        }
        <div
          className={classNames('launch', 'button')}
          onClick={onLaunchClicked}
        >
          LAUNCH
        </div>
      </div>
      <div className="divider">{'\u00A0'}</div>
      {
        appExtendedSettings.map((setting, index) => [
          <div key={`${setting.key}-${index}`} className="setting">
            <div className="setting-title">
              {setting.title}
            </div>
            <div
              className={
                classNames(
                  'setting-value',
                  setting?.type
                )
              }
            >
              <SettingValue
                config={setting}
                onChange={value => onChange(setting, value)}
                value={getSettingValue(setting)}
              />
            </div>
          </div>,
          <div
            key={`${setting.key}-${index}-divider`}
            className="setting-divider"
          >
            {'\u00A0'}
          </div>
        ]).reduce((r, c) => ([...r, ...c]), [])
      }
    </div>
  );
}
