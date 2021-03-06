import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import useApplicationIcon from '../utilities/use-application-icon';
import UserAttributes from './user-attributes';
import { useSettings } from '../use-settings';
import Markdown from './markdown';
import './launch-folder-application.css';

function LaunchFolderApplication(
  {
    application,
  },
) {
  const {
    iconFile,
    name,
    description,
    fullDescription,
    url,
    storage,
    info = {},
  } = application || {};
  const settings = useSettings();
  const { icon } = useApplicationIcon(storage, iconFile ? iconFile.path : undefined);
  const pathProperties = Object
    .values(settings?.folderApplicationPathAttributes || {})
    .filter((propertyName) => !/^(name|description|fullDescription)$/i.test(propertyName))
    .filter((propertyName) => !!info[propertyName]);
  const owner = info?.user;
  const ownerInfo = info?.ownerInfo;
  if (!application) {
    return null;
  }
  return (
    <div
      className="launch-folder-application"
    >
      <div className="launch-folder-application-info">
        {
          icon && (
            <img
              src={icon}
              alt={name}
              className="launch-folder-application-icon"
            />
          )
        }
        {
          url && (
            <a
              className="launch-folder-application-launch-a"
              href={url}
            >
              <div
                className="launch-folder-application-launch"
              >
                LAUNCH
              </div>
            </a>
          )
        }
        <div
          className={classNames('launch-folder-application-title', 'launch-folder-application-row')}
        >
          {name}
        </div>
        {
          description && (
            <div
              className={
                classNames(
                  'launch-folder-application-row',
                  'launch-folder-application-short-description',
                )
              }
            >
              {description}
            </div>
          )
        }
        {
          ownerInfo && (
            <div
              className={
                classNames(
                  'launch-folder-application-author',
                  'launch-folder-application-row',
                  'launch-folder-application-property',
                )
              }
            >
              <span className="key">Owner:</span>
              <UserAttributes
                user={{ attributes: ownerInfo }}
                className={
                  classNames(
                    'launch-folder-application-attributes',
                    'value',
                  )
                }
                attributeClassName="launch-folder-application-user-attribute"
                skip={['email', 'e-mail']}
              />
            </div>
          )
        }
        {
          !ownerInfo && owner && (
            <div
              className={
                classNames(
                  'launch-folder-application-author',
                  'launch-folder-application-row',
                  'launch-folder-application-property',
                )
              }
            >
              <span className="key">Owner:</span>
              <span className="value">
                {owner}
              </span>
            </div>
          )
        }
        {
          pathProperties.map((property) => (
            <div
              key={property}
              className={
                classNames(
                  'launch-folder-application-row',
                  'launch-folder-application-property',
                )
              }
            >
              <span className="key">
                {property}
                :
              </span>
              <span className="value">
                {info[property]}
              </span>
            </div>
          ))
        }
        {
          fullDescription && (
            <Markdown
              className={
                classNames(
                  'launch-folder-application-row',
                  'launch-folder-application-description',
                )
              }
              style={{ width: '100%' }}
            >
              {fullDescription}
            </Markdown>
          )
        }
      </div>
    </div>
  );
}

LaunchFolderApplication.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  application: PropTypes.object,
};

LaunchFolderApplication.defaultProps = {
  application: undefined,
};

export default LaunchFolderApplication;
