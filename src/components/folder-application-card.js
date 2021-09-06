import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './components.css';
import Gear from './shared/gear';
import Star from './shared/star';
import useApplicationIcon from './utilities/use-application-icon';
import UserAttributes from './shared/user-attributes';

function FolderApplicationCard(
  {
    application,
    className,
    tabIndex,
    onEdit,
    onClick,
    isFavourite,
    onFavouriteClick,
    displayFavourite = true,
    disabled,
  },
) {
  if (!application || !application.name) {
    return null;
  }
  const {
    iconFile,
    name,
    description,
    version,
    published,
    url,
    storage,
    info = {},
  } = application;
  const { icon } = useApplicationIcon(storage, iconFile ? iconFile.path : undefined);
  const onClickCallback = useCallback((e) => {
    if (onClick) {
      e.stopPropagation();
      e.preventDefault();
      onClick(application);
    }
  }, [application, onClick]);
  const onEditCallback = useCallback((e) => {
    if (onEdit) {
      e.stopPropagation();
      e.preventDefault();
      onEdit(application);
    }
  }, [application, onEdit]);
  const onFavouriteClickCallback = useCallback((e) => {
    if (onFavouriteClick) {
      e.stopPropagation();
      e.preventDefault();
      onFavouriteClick(application);
    }
  }, [application, onFavouriteClick]);
  const owner = info.user;
  const { ownerInfo } = info;
  // eslint-disable-next-line react/prop-types
  const Wrapper = ({ children }) => {
    if (!disabled && !onClick && published && url) {
      return (
        <a
          className="no-link"
          href={url}
          onClick={onClickCallback}
        >
          {children}
        </a>
      );
    }
    return <>{children}</>;
  };
  return (
    <Wrapper>
      <div
        tabIndex={disabled ? -1 : tabIndex}
        role="button"
        className={
          classNames(
            'app',
            'app-folder',
            {
              dark: DARK_MODE,
              published,
              disabled,
            },
            className,
          )
        }
        onClick={disabled ? undefined : onClickCallback}
        onKeyPress={disabled ? undefined : onClickCallback}
      >
        <div className="layout">
          {
            icon && (
              <img
                src={icon}
                alt={name}
                className="icon"
              />
            )
          }
          <div className="layout-column">
            <div className="header" title={name}>
              <span className="name">
                {name}
              </span>
              {
                version && (
                  <span className="version">
                    {version}
                  </span>
                )
              }
            </div>
            <div className="app-description" title={description}>
              {description}
            </div>
            {
              ownerInfo && (
                <div className="app-owner" title={owner}>
                  <UserAttributes
                    user={{ attributes: ownerInfo }}
                    className="attributes"
                    attributeClassName="user-attribute"
                    skip={['email', 'e-mail']}
                  />
                </div>
              )
            }
            {
              !ownerInfo && owner && (
                <div className="app-owner" title={owner}>
                  {owner}
                </div>
              )
            }
          </div>
        </div>
        <div className="folder-app-actions-container">
          {
            displayFavourite && (
              <Star
                tabIndex={disabled ? -1 : tabIndex}
                className={
                  classNames(
                    'folder-app-action',
                    'folder-app-star',
                    {
                      favourite: isFavourite,
                    },
                  )
                }
                onClick={onFavouriteClickCallback}
              />
            )
          }
          {
            onEdit && (
              <Gear
                tabIndex={disabled ? -1 : tabIndex}
                className={classNames('folder-app-action', 'folder-app-gear')}
                onClick={onEditCallback}
              />
            )
          }
        </div>
      </div>
    </Wrapper>
  );
}

FolderApplicationCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  application: PropTypes.object,
  className: PropTypes.string,
  tabIndex: PropTypes.number,
  onEdit: PropTypes.func,
  onClick: PropTypes.func,
  isFavourite: PropTypes.bool,
  onFavouriteClick: PropTypes.func,
  displayFavourite: PropTypes.bool,
  disabled: PropTypes.bool,
};

FolderApplicationCard.defaultProps = {
  application: undefined,
  className: undefined,
  tabIndex: 0,
  onEdit: undefined,
  onClick: undefined,
  isFavourite: false,
  onFavouriteClick: undefined,
  displayFavourite: true,
  disabled: false,
};

export default FolderApplicationCard;
