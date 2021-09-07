import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import useAdvancedUser from './components/utilities/use-advanced-user';
import { useSettings, SettingsContext } from './components/use-settings';
import useAuthenticatedUser from './components/utilities/user-authenticated-user';
import useFolderApplications from './components/utilities/use-folder-applications';
import LoadingIndicator from './components/shared/loading-indicator';
import FolderApplicationCard from './components/folder-application-card';
import EditFolderApplication from './edit-folder-application';
import PickUpFolderApplicationModal from './components/shared/pick-up-folder-application-modal';
import Modal from './components/shared/modal';
import filterAppFn from './components/utilities/filter-applications-fn';
import useFavouriteApplications from './components/utilities/use-favourite-applications';
import LaunchFolderApplication from './components/shared/launch-folder-application';
import Help from './components/shared/help';
import {
  FAValidationSessionsContext,
  useSessions,
} from './models/validate-folder-application';
import './components/components.css';
import './app.css';
import useEnterKey from './helpers/use-enter-key';

function FolderApp({ location }) {
  const settings = useSettings();
  const sessions = useSessions(settings);
  const {
    authenticatedUser,
    pending: authenticating,
    error: authenticationError,
  } = useAuthenticatedUser();
  const {
    canPublishApps,
    canEditPublishedApps,
  } = useAdvancedUser(settings, authenticatedUser);
  const [options, setOptions] = useState({});
  const [selectApplication, setSelectApplication] = useState(false);
  const [launchApplication, setLaunchApplication] = useState(undefined);
  const onApplicationLaunchCancelled = useCallback(
    () => setLaunchApplication(undefined),
    [setLaunchApplication],
  );
  const onPublishClick = useCallback(
    () => setSelectApplication(true),
    [setSelectApplication],
  );
  const onClosePickUpApplication = useCallback(
    () => setSelectApplication(false),
    [setSelectApplication],
  );
  useEffect(() => {
    if (settings) {
      setOptions(settings.parseUrl(location.href));
    }
  }, [location.href, settings, setOptions]);
  const {
    applications,
    pending,
    reload,
  } = useFolderApplications(options);
  const [application, setApplication] = useState(undefined);
  const [filter, setFilter] = useState(undefined);
  const onChangeFilter = useCallback((e) => setFilter(e.target.value), [setFilter]);
  const goBack = useCallback(() => {
    reload();
    setApplication(undefined);
  }, [setApplication, reload]);
  const goBackKeyPress = useEnterKey(goBack);
  const onPublishKeyPress = useEnterKey(onPublishClick);
  const onSelectAppToPublish = useCallback((app) => {
    setSelectApplication(false);
    setApplication(app);
  }, [setApplication, setSelectApplication]);
  const applicationIsEditable = useCallback((app) => canEditPublishedApps
      || (app?.info?.user || '').toLowerCase() === (authenticatedUser?.userName || '').toLowerCase(), [canEditPublishedApps, authenticatedUser]);
  const {
    isFavourite,
    toggleFavourite,
    sorter,
  } = useFavouriteApplications();
  let applicationsContent;
  let editApplicationContent;
  const modalIsVisible = !!launchApplication || selectApplication;
  if (authenticating || pending) {
    applicationsContent = (
      <div className="content loading">
        <LoadingIndicator style={{ marginRight: 5, width: 15, height: 15 }} />
        <span>Fetching applications list</span>
      </div>
    );
  } else if (authenticationError || !authenticatedUser) {
    applicationsContent = (
      <div className="content error">
        <div className="header">
          Authentication error
        </div>
        <div className="description">
          Please, contact
          {' '}
          {settings?.supportName || 'support team'}
          {' '}
          for details.
        </div>
      </div>
    );
  } else if (application) {
    editApplicationContent = (
      <EditFolderApplication
        application={application}
        applications={applications}
        goBack={goBack}
      />
    );
  } else if (applications.length === 0) {
    applicationsContent = (
      <div className="content error">
        <div className="header">
          No applications configured
        </div>
        <div className="description">
          Please, contact
          {' '}
          {settings?.supportName || 'support team'}
          {' '}
          for details.
        </div>
      </div>
    );
  } else {
    applicationsContent = (
      <div
        className={classNames('apps', 'folder-apps')}
      >
        {
          applications
            .filter(filterAppFn(filter))
            .sort(sorter)
            .map((app) => (
              <FolderApplicationCard
                key={app.id}
                tabIndex={modalIsVisible ? -1 : 0}
                application={app}
                onEdit={
                  applicationIsEditable(app)
                    ? setApplication
                    : undefined
                }
                isFavourite={isFavourite(app)}
                onFavouriteClick={toggleFavourite}
                onClick={setLaunchApplication}
              />
            ))
        }
      </div>
    );
  }
  return (
    <FAValidationSessionsContext.Provider value={sessions}>
      <SettingsContext.Provider value={settings}>
        <div className="application">
          <div
            className={
              classNames(
                'static-header',
                'displayed',
              )
            }
          >
            {
              application && (
                <div
                  onClick={goBack}
                  role="button"
                  tabIndex={modalIsVisible ? -1 : 0}
                  onKeyPress={goBackKeyPress}
                  className="link"
                >
                  BACK TO APPLICATIONS
                </div>
              )
            }
            {
              !application && (
                <div
                  className={
                    classNames(
                      'filter-applications',
                      {
                        dark: DARK_MODE,
                      },
                    )
                  }
                >
                  <input
                    value={filter || ''}
                    onChange={onChangeFilter}
                    placeholder="Filter applications"
                  />
                </div>
              )
            }
            {
              canPublishApps && !application && (
                <div
                  className="link"
                  role="button"
                  tabIndex={modalIsVisible ? -1 : 0}
                  onKeyPress={onPublishKeyPress}
                  onClick={onPublishClick}
                >
                  NEW APP
                </div>
              )
            }
          </div>
          {
            CP_APPLICATIONS_LOGO && (
              <div className="static-footer">
                <img className="logo" src={CP_APPLICATIONS_LOGO} alt="Logo" />
              </div>
            )
          }
          {
            editApplicationContent && (
              <div
                className="edit-application"
                style={{ position: 'relative' }}
              >
                {editApplicationContent}
              </div>
            )
          }
          {
            applicationsContent && (
              <div style={{ position: 'relative' }}>
                {applicationsContent}
              </div>
            )
          }
        </div>
        <PickUpFolderApplicationModal
          visible={selectApplication}
          onClose={onClosePickUpApplication}
          onSelectApplication={onSelectAppToPublish}
        />
        <Modal
          className="launch-folder-application-modal"
          visible={!!launchApplication}
          title={false}
          onClose={onApplicationLaunchCancelled}
          closeButton
        >
          <LaunchFolderApplication application={launchApplication} />
        </Modal>
        <Help className="help" />
      </SettingsContext.Provider>
    </FAValidationSessionsContext.Provider>
  );
}

FolderApp.propTypes = {
  location: PropTypes.shape({
    href: PropTypes.string,
  }).isRequired,
};

export default FolderApp;
