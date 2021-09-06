import React, {useCallback, useContext, useState} from 'react';
import classNames from 'classnames';
import {ExtendedSettingsContext} from './utilities/use-extended-settings';
import useAppExtendedSettings from './utilities/use-app-extended-settings';
import LoadingIndicator from './shared/loading-indicator';
import clearSessionInfo from '../models/clear-session-info';
import Gear from './shared/gear';
import './components.css';
import {useSettings} from "./use-settings";

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

export default function ApplicationCard(
  {
    application,
    onClick,
    onOpenExtendedSettings,
    options
  }
) {
  const {
    appendDefault,
    getSettingValue,
    options: extendedOptions,
    onChange
  } = useAppExtendedSettings(application);
  const appSettings = useSettings();
  const onChangeOptions = (setting, value) => {
    onChange(setting, value, true);
  }
  const appExtendedSettings = useContext(ExtendedSettingsContext);
  const hasExtendedSettings = Object.keys(appExtendedSettings).length > 0;
  // const onExtendedSettingsClicked = useCallback((e) => {
  //   e && e.stopPropagation();
  //   e && e.preventDefault();
  //   onOpenExtendedSettings && onOpenExtendedSettings(application);
  // }, [onOpenExtendedSettings, appExtendedSettings]);
  const onLaunch = useCallback(() => {
    onClick && onClick(appendDefault(extendedOptions));
  }, [extendedOptions, appendDefault]);
  const [visible, setVisible] = useState(false);
  const showPopup = useCallback((e) => {
    e && e.stopPropagation();
    e && e.preventDefault();
    setVisible(true);
  }, [setVisible]);
  const hidePopup = useCallback((e) => {
    e && e.stopPropagation();
    e && e.preventDefault();
    setVisible(false);
  }, [setVisible]);
  const extendedOptionsPresentation = [];
  for (let setting of appExtendedSettings) {
    const value = getSettingValue(setting);
    const title = setting.title;
    const valueStr = setting.valuePresentation(value || setting.default) || 'Default';
    extendedOptionsPresentation.push((
      <span
        key={setting.key}
        className="extended-setting-presentation"
      >
        {title}: {valueStr}
      </span>
    ));
  }
  const [clearingSessionInfo, setClearingSessionInfo] = useState(false);
  const clearSessionInfoCallback = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setClearingSessionInfo(true);
    clearSessionInfo(
      application,
      appSettings,
      {
        ...options,
        ...appendDefault(extendedOptions)
      }
    )
      .then(() => {
        setClearingSessionInfo(false);
      })
      .catch(e => {
        console.error(e);
        setClearingSessionInfo(false);
      })
  }, [
    setClearingSessionInfo,
    clearSessionInfo,
    appSettings,
    appExtendedSettings,
    extendedOptions,
    appendDefault,
    options
  ]);
  const hasSessionInfoSettings = appSettings?.sessionInfoStorage && appSettings?.sessionInfoPath;
  return (
    <div
      className={`app ${DARK_MODE ? 'dark' : ''}`}
      onClick={onLaunch}
    >
      {
        application.background && (
          <div
            className="background"
            style={
              Object.assign(
                {
                  backgroundImage: `url("${application.background}")`
                },
                application.backgroundStyle || {}
              )
            }
          >
            {'\u00A0'}
          </div>
        )
      }
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
      </div>
      <div className="app-description">
        {application.description}
      </div>
      {
        (hasExtendedSettings || hasSessionInfoSettings) && (
          <div className="app-settings">
            <div className="gear-container">
              <Gear className="gear" onClick={showPopup}>
                {extendedOptionsPresentation}
              </Gear>
              <div
                className={classNames('overlay', {visible})}
                onClick={hidePopup}
              >
                {'\u00A0'}
              </div>
              <div
                className={classNames('popup', {visible})}
                onClick={hidePopup}
              >
                {
                  appExtendedSettings.map((setting, index, array) => [
                    <div key={`${setting.key}-${index}`} className="setting">
                      <div className="setting-title">
                        {setting.title}:
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
                          onChange={value => onChangeOptions(setting, value)}
                          value={getSettingValue(setting)}
                        />
                      </div>
                    </div>,
                    index < array.length - 1 ? (
                      <div
                        key={`${setting.key}-${index}-divider`}
                        className="setting-divider"
                      >
                        {'\u00A0'}
                      </div>
                    ) : undefined
                  ]).reduce((r, c) => ([...r, ...c]), [])
                }
                {
                  hasExtendedSettings && hasSessionInfoSettings && (
                    <div
                      className="settings-main-divider"
                    >
                    </div>
                  )
                }
                {
                  hasSessionInfoSettings && (
                    <div
                      className="app-session-info"
                      onClick={
                        clearingSessionInfo
                          ? undefined
                          : clearSessionInfoCallback
                      }
                    >
                      {
                        clearingSessionInfo && (
                          <>
                            <span>
                              Clearing session info...
                            </span>
                            <LoadingIndicator
                              style={{
                                fill: '#aaa',
                                width: 8,
                                height: 8,
                                marginLeft: 5
                              }}
                            />
                          </>
                        )
                      }
                      {
                        !clearingSessionInfo && (
                          <span className="clear-session-info-link">
                            Clear session info
                          </span>
                        )
                      }
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
