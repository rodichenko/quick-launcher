import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Modal from './modal';
import useAuthenticatedUser from '../utilities/user-authenticated-user';
import { useSettings } from '../use-settings';
import getUsersInfo from '../../models/cloud-pipeline-api/get-users-info';
import useFolderApplications from '../utilities/use-folder-applications';
import FolderApplicationCard from '../folder-application-card';
import useAdvancedUser from '../utilities/use-advanced-user';
import filterAppFn from '../utilities/filter-applications-fn';
import UserAttributes from './user-attributes';
import './pick-up-folder-application-modal.css';
import useEnterKey, { onEnterKey } from '../../helpers/use-enter-key';

function filterUserFn(filter) {
  return function filterFn(user) {
    return !filter
      || (user.name || '').toLowerCase().includes(filter.toLowerCase())
      || !!Object.values(user.attributes || {})
        .find((attributeValue) => (attributeValue || '').toLowerCase()
          .includes(filter.toLowerCase()));
  };
}

function PickUpFolderApplicationModal(
  {
    visible,
    onClose,
    onSelectApplication,
    ignoredApplications = [],
  },
) {
  const {
    authenticatedUser,
    pending: authenticating,
    error: authenticationError,
  } = useAuthenticatedUser();
  const settings = useSettings();
  const [user, setUser] = useState(undefined);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState(undefined);
  const [appsFilter, setAppsFilter] = useState(undefined);
  const [pending, setPending] = useState(true);
  const onFilterChange = useCallback((e) => setFilter(e.target.value), [setFilter]);
  const onAppsFilterChange = useCallback((e) => setAppsFilter(e.target.value), [setAppsFilter]);
  const {
    canEditPublishedApps: userSelectionAvailable,
  } = useAdvancedUser(settings, authenticatedUser);
  useEffect(() => {
    if (authenticatedUser && visible) {
      setPending(true);
      if (userSelectionAvailable) {
        getUsersInfo()
          .then((result) => {
            setUsers(result);
          })
          .catch((e) => {
            console.error(e.message);
            setUser(authenticatedUser);
          })
          .then(() => {
            setPending(false);
          });
      } else {
        setUser(authenticatedUser);
        setPending(false);
      }
    }
  }, [
    authenticatedUser,
    userSelectionAvailable,
    setUser,
    settings,
    setPending,
    visible,
  ]);
  const selectUser = useCallback((selectedUser) => {
    setUser(selectedUser ? { ...selectedUser, userName: selectedUser.name } : undefined);
    setFilter(undefined);
    setAppsFilter(undefined);
  }, [setUser, setFilter, setAppsFilter]);
  useEffect(() => {
    if (!visible && userSelectionAvailable) {
      selectUser(undefined);
    }
  }, [visible, userSelectionAvailable, selectUser]);
  const [options, setOptions] = useState({});
  const { location } = document;
  useEffect(() => {
    if (settings) {
      setOptions(settings.parseUrl(location.href));
    }
  }, [location.href, settings, setOptions]);
  const {
    applications,
    pending: applicationsPending,
  } = useFolderApplications(options, false, ...(user ? [user] : []));
  const title = user ? `Select ${user.userName}'s application` : 'Select user';
  const clearSelection = useCallback(() => {
    selectUser(undefined);
  }, [selectUser]);
  const clearSelectionKeyPress = useEnterKey(clearSelection);
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={
        pending
          ? false
          : title
      }
      className="pick-up-application-modal"
      closeButton
    >
      {
        authenticationError && (
          <div className="authentication-error">
            {authenticationError}
          </div>
        )
      }
      {
        (authenticating || pending) && (
          <div className="pick-up-loading">
            Loading...
          </div>
        )
      }
      {
        !authenticationError && !authenticating && !pending && !user && (
          <div>
            <div className="filter">
              <input
                className="filter-input"
                value={filter || ''}
                onChange={onFilterChange}
              />
            </div>
            <div className="users">
              {
                (users || [])
                  .filter(filterUserFn(filter))
                  .map((filteredUser) => (
                    <div
                      key={filteredUser.name}
                      className={
                        classNames(
                          'user',
                          {
                            current: filteredUser.name === authenticatedUser?.userName,
                          },
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyPress={onEnterKey(() => selectUser(filteredUser))}
                      onClick={() => selectUser(filteredUser)}
                    >
                      <div>{filteredUser.name}</div>
                      <UserAttributes
                        user={filteredUser}
                        className="attributes"
                        attributeClassName="user-attribute"
                      />
                    </div>
                  ))
              }
            </div>
          </div>
        )
      }
      {
        !authenticationError && !authenticating && !pending && !!user && applicationsPending && (
          <div className="pick-up-loading">
            Loading...
          </div>
        )
      }
      {
        !authenticationError && !authenticating && !pending && !!user && !applicationsPending && (
          <div>
            <div className="filter">
              {
                userSelectionAvailable && (
                  <div
                    className="back-to-users"
                    tabIndex={0}
                    role="button"
                    onKeyPress={clearSelectionKeyPress}
                    onClick={clearSelection}
                  >
                    {'< BACK'}
                  </div>
                )
              }
              <input
                className="filter-input"
                value={appsFilter || ''}
                onChange={onAppsFilterChange}
              />
            </div>
            {
              applications.length === 0 && (
                <div className="pick-up-loading">
                  Applications not found
                </div>
              )
            }
            <div className="pick-up-applications">
              {
                applications
                  .filter(filterAppFn(appsFilter))
                  .map((application) => (
                    <FolderApplicationCard
                      className={
                        classNames(
                          'pick-up-application',
                          { ignored: ignoredApplications.includes(application.id) },
                        )
                      }
                      disabled={ignoredApplications.includes(application.id)}
                      key={application.id}
                      application={application}
                      onClick={
                        ignoredApplications.includes(application.id)
                          ? undefined
                          : onSelectApplication
                      }
                      displayFavourite={false}
                    />
                  ))
              }
            </div>
          </div>
        )
      }
    </Modal>
  );
}

PickUpFolderApplicationModal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  onSelectApplication: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  ignoredApplications: PropTypes.array,
};

PickUpFolderApplicationModal.defaultProps = {
  visible: false,
  onClose: undefined,
  onSelectApplication: undefined,
  ignoredApplications: [],
};

export default PickUpFolderApplicationModal;
