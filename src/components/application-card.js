/* eslint-disable react/no-array-index-key */
import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ExtendedSettingsContext } from './utilities/use-extended-settings';
import useAppExtendedSettings from './utilities/use-app-extended-settings';
import LoadingIndicator from './shared/loading-indicator';
import clearSessionInfo from '../models/clear-session-info';
import Gear from './shared/gear';
import SettingValue from './setting-value';
import './components.css';
import { useSettings } from './use-settings';

function ApplicationCard(
  {
    application,
    onClick,
    options,
  },
) {
  const {
    appendDefault,
    getSettingValue,
    options: extendedOptions,
    onChange,
  } = useAppExtendedSettings(application);
  const appSettings = useSettings();
  const onChangeOptions = (setting, value) => {
    onChange(setting, value, true);
  };
  const appExtendedSettings = useContext(ExtendedSettingsContext);
  const hasExtendedSettings = Object.keys(appExtendedSettings).length > 0;
  // const onExtendedSettingsClicked = useCallback((e) => {
  //   e && e.stopPropagation();
  //   e && e.preventDefault();
  //   onOpenExtendedSettings && onOpenExtendedSettings(application);
  // }, [onOpenExtendedSettings, appExtendedSettings]);
  const onLaunch = useCallback(() => {
    if (onClick) {
      onClick(appendDefault(extendedOptions));
    }
  }, [extendedOptions, appendDefault]);
  const [visible, setVisible] = useState(false);
  const showPopup = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setVisible(true);
  }, [setVisible]);
  const hidePopup = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setVisible(false);
  }, [setVisible]);
  const extendedOptionsPresentation = [];
  // eslint-disable-next-line no-restricted-syntax
  for (let s = 0; s < appExtendedSettings.length; s += 1) {
    const setting = appExtendedSettings[s];
    const value = getSettingValue(setting);
    const { title } = setting;
    const valueStr = setting.valuePresentation(value || setting.default) || 'Default';
    extendedOptionsPresentation.push((
      <span
        key={setting.key}
        className="extended-setting-presentation"
      >
        {title}
        :
        {valueStr}
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
        ...appendDefault(extendedOptions),
      },
    )
      .then(() => {
        setClearingSessionInfo(false);
      })
      .catch((error) => {
        console.error(error);
        setClearingSessionInfo(false);
      });
  }, [
    setClearingSessionInfo,
    clearSessionInfo,
    appSettings,
    appExtendedSettings,
    extendedOptions,
    appendDefault,
    options,
  ]);
  const hasSessionInfoSettings = appSettings?.sessionInfoStorage && appSettings?.sessionInfoPath;
  return (
    <div
      tabIndex={0}
      role="button"
      className={`app ${DARK_MODE ? 'dark' : ''}`}
      onClick={onLaunch}
      onKeyPress={onLaunch}
    >
      {
        application.background && (
          <div
            className="background"
            style={
              ({
                backgroundImage: `url("${application.background}")`,
                ...application.backgroundStyle || {},
              })
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
                tabIndex={0}
                role="button"
                className={classNames('overlay', { visible })}
                onClick={hidePopup}
                onKeyPress={hidePopup}
              >
                {'\u00A0'}
              </div>
              <div
                tabIndex={0}
                role="button"
                className={classNames('popup', { visible })}
                onClick={hidePopup}
                onKeyPress={hidePopup}
              >
                {
                  appExtendedSettings.map((setting, index, array) => [
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={`${setting.key}-${index}`} className="setting">
                      <div className="setting-title">
                        {setting.title}
                        :
                      </div>
                      <div
                        className={
                          classNames(
                            'setting-value',
                            setting?.type,
                          )
                        }
                      >
                        <SettingValue
                          config={setting}
                          onChange={(value) => onChangeOptions(setting, value)}
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
                    ) : undefined,
                  ]).reduce((r, c) => ([...r, ...c]), [])
                }
                {
                  hasExtendedSettings && hasSessionInfoSettings && (
                    <div
                      className="settings-main-divider"
                    />
                  )
                }
                {
                  hasSessionInfoSettings && (
                    <div
                      className="app-session-info"
                      tabIndex={0}
                      role="button"
                      onClick={
                        clearingSessionInfo
                          ? undefined
                          : clearSessionInfoCallback
                      }
                      onKeyPress={
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
                                marginLeft: 5,
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

ApplicationCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  application: PropTypes.object,
  onClick: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  options: PropTypes.object,
};

ApplicationCard.defaultProps = {
  application: undefined,
  onClick: undefined,
  options: undefined,
};

export default ApplicationCard;
