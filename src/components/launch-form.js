/* eslint-disable react/no-array-index-key */
import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './components.css';
import { ExtendedSettingsContext } from './utilities/use-extended-settings';
import useAppExtendedSettings from './utilities/use-app-extended-settings';
import SettingValue from './setting-value';

function LaunchForm(
  {
    application,
    onLaunch,
  },
) {
  const appExtendedSettings = useContext(ExtendedSettingsContext);
  const {
    appendDefault,
    getSettingValue,
    onChange,
    options,
    save,
  } = useAppExtendedSettings(application);
  const onLaunchClicked = useCallback(() => {
    save(options);
    if (onLaunch) {
      onLaunch(appendDefault(options));
    }
  }, [options, save, onLaunch, appendDefault]);
  return (
    <div className={classNames('app-launch-form', { dark: DARK_MODE })}>
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
          tabIndex={0}
          role="button"
          className={classNames('launch', 'button')}
          onClick={onLaunchClicked}
          onKeyPress={onLaunchClicked}
        >
          LAUNCH
        </div>
      </div>
      <div className="divider">{'\u00A0'}</div>
      {
        appExtendedSettings.map((setting, index) => [
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${setting.key}-${index}`} className="setting">
            <div className="setting-title">
              {setting.title}
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
                onChange={(value) => onChange(setting, value)}
                value={getSettingValue(setting)}
              />
            </div>
          </div>,
          <div
            key={`${setting.key}-${index}-divider`}
            className="setting-divider"
          >
            {'\u00A0'}
          </div>,
        ]).reduce((r, c) => ([...r, ...c]), [])
      }
    </div>
  );
}

LaunchForm.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  application: PropTypes.object,
  onLaunch: PropTypes.func,
};

LaunchForm.defaultProps = {
  application: undefined,
  onLaunch: undefined,
};

export default LaunchForm;
