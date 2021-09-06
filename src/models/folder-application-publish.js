import processString from './process-string';
import getDataStorageContents from './cloud-pipeline-api/data-storage-contents';
import folderApplicationRemove from './folder-application-remove';
import copyDataStorageItem from './cloud-pipeline-api/data-storage-item-copy';
import folderApplicationUpdate from './folder-application-update';
import fetchFolderApplications from './fetch-folder-applications';
import downloadDataStorageItem from './cloud-pipeline-api/data-storage-item-download';
import removeExtraSlash from './utilities/remove-slashes';

function pathExists(storage, path) {
  return new Promise((resolve) => {
    getDataStorageContents(storage, path)
      .then((contents) => {
        resolve(contents.length > 0);
      });
  });
}

function generatePath(settings, pathInfo, name) {
  if (!settings || !settings.appConfigPath) {
    return Promise.reject(new Error('Application config path is not defined'));
  }
  return processString(
    settings.appConfigPath,
    {
      ...(pathInfo || {}),
      [settings.folderApplicationAppPlaceholder || 'app']: name,
    },
  );
}

function findApplicationDestinationPath(
  settings,
  application,
  info,
) {
  if (!settings || !settings.appConfigPath) {
    return Promise.reject(new Error('Application config path is not defined'));
  }
  const pathInfo = {
    ...(application?.pathInfo || {}),
    [settings.folderApplicationUserPlaceholder || 'user']: settings.serviceUser,
  };
  const defaultPath = generatePath(
    settings,
    pathInfo,
    pathInfo[settings.folderApplicationAppPlaceholder || 'app'],
  );
  if (
    application?.published
    && removeExtraSlash(defaultPath) === removeExtraSlash(application.path)
  ) {
    return Promise.resolve(defaultPath);
  }
  const user = info?.user || application?.info?.user || 'anonymous';
  const alternativePath = generatePath(
    settings,
    pathInfo,
    `${pathInfo[settings.folderApplicationAppPlaceholder || 'app']}_${user}`,
  );
  const alternativeFolder = alternativePath.split('/').slice(0, -1).join('/');
  const alternativeFile = alternativePath.split('/').pop();
  const findAlternativePath = (index = 0) => new Promise((resolve) => {
    const pathCorrected = index ? `${alternativeFolder}_${index}` : alternativeFolder;
    pathExists(application?.storage, pathCorrected)
      .then((exists) => {
        if (exists) {
          return findAlternativePath(index + 1);
        }
        return Promise.resolve(`${pathCorrected}/${alternativeFile}`);
      })
      .then(resolve);
  });
  return new Promise((resolve) => {
    const defaultPathFolder = defaultPath.split('/').slice(0, -1).join('/');
    pathExists(application?.storage, defaultPathFolder)
      .then((exists) => {
        if (exists) {
          return findAlternativePath();
        }
        return Promise.resolve(defaultPath);
      })
      .then(resolve);
  });
}

function removeApplication(application, settings, keepIconFilePath, callbackPassed) {
  const callback = (...opts) => {
    if (callbackPassed) {
      callbackPassed(...opts);
    }
  };
  return new Promise((resolve, reject) => {
    callback('Removing application...', 0);
    if (keepIconFilePath) {
      callback('Removing application: fetching previous icon', 0.1);
      downloadDataStorageItem(application.storage, keepIconFilePath)
        .then((resultedBlob) => {
          const blob = resultedBlob;
          if (blob) {
            blob.name = keepIconFilePath.split('/').pop();
          }
          callback('Removing application...', 0.5);
          folderApplicationRemove(application, settings)
            .then(() => {
              callback('Removing application...', 1);
              resolve(blob);
            })
            .catch(reject);
        });
    } else {
      callback('Removing application...', 0.5);
      folderApplicationRemove(application, settings)
        .then(() => {
          callback('Removing application...', 1);
          resolve();
        })
        .catch(reject);
    }
  });
}

export default function folderApplicationPublish(
  settings,
  application,
  spec,
  icon,
  keepPreviousIcon = true,
  callback,
) {
  if (!settings || !settings.serviceUser) {
    return Promise.reject(new Error('Service user is not defined'));
  }
  if (!settings || !settings.appConfigPath) {
    return Promise.reject(new Error('Application config path is not defined'));
  }
  if (!application || !application.info) {
    return Promise.reject(new Error('Application is not defined'));
  }
  if (!application || !application.storage) {
    return Promise.reject(new Error('Application storage is not defined'));
  }
  let appIcon = icon;
  const {
    published,
    info = {},
  } = application;
  let source = published ? info.source : info.path;
  if (!source) {
    return Promise.reject(new Error('Application source folder is not defined'));
  }
  const subCallback = (from, to) => (callback
    ? ((o, progress) => callback(o, from + (progress * (to - from))))
    : undefined);
  return new Promise((resolve, reject) => {
    callback('Determining destination folder...', 0.01);
    findApplicationDestinationPath(
      settings,
      application,
      spec,
    )
      .then((destinationGatewaySpec) => {
        console.log(destinationGatewaySpec);
        if (!destinationGatewaySpec) {
          throw new Error('Application destination folder is not defined');
        }
        let destination = destinationGatewaySpec.split('/').slice(0, -1).join('/');
        if (!destination.endsWith('/')) {
          destination = destination.concat('/');
        }
        if (!source.endsWith('/')) {
          source = source.concat('/');
        }
        if (removeExtraSlash(destination) === removeExtraSlash(source)) {
          throw new Error('Cannot redistribute application from the same path');
        }
        callback('Checking destination folder...', 0.1);
        getDataStorageContents(application.storage, destination)
          .then((contents) => {
            if (contents.length > 0) {
              if (keepPreviousIcon && !appIcon) {
                const previousIconFile = contents
                  .find((o) => /^gateway.(png|jpg|tiff|jpeg|svg)$/i.test(o.name) && /^file$/i.test(o.type));
                return removeApplication(
                  application,
                  settings,
                  previousIconFile?.path,
                  subCallback(0.2, 0.5),
                );
              }
              return removeApplication(application, settings, undefined, subCallback(0.2, 0.5));
            } if (
              application.published
              && removeExtraSlash(application.path) !== removeExtraSlash(destinationGatewaySpec)
            ) {
              return removeApplication(
                application,
                settings,
                application.iconFile?.path,
                subCallback(0.2, 0.5),
              );
            }
            return Promise.resolve();
          })
          .then((previousIconFileBlob) => {
            appIcon = appIcon || previousIconFileBlob;
            callback('Copying application files...', 0.6);
            console.log(
              'Copy folder application',
              application.info.name,
              'from',
              source,
              'to',
              destination,
            );
            return copyDataStorageItem(application.storage, source, destination);
          })
          .then((result) => {
            callback('Copying application files: done', 0.8);
            // eslint-disable-next-line no-param-reassign
            application.path = destinationGatewaySpec;
            const { status, message } = result || {};
            if (!/^ok$/i.test(status)) {
              throw new Error(`Error copying application ${application.info.name}: ${message}`);
            }
            return Promise.resolve();
          })
          .then(() => {
            callback('Updating info...', 0.81);
            return folderApplicationUpdate(
              settings,
              application,
              spec,
              appIcon,
              false,
              subCallback(0.81, 0.9),
            );
          })
          .then(() => {
            callback('Finishing', 0.9);
            const options = settings.parseUrl(window.location.href);
            return fetchFolderApplications(
              settings,
              options,
              { userName: settings.serviceUser },
              true,
            );
          })
          .then(resolve)
          .catch((e) => {
            console.error(e.message);
            reject(e);
          });
      })
      .catch((e) => {
        console.error(e.message);
        reject(e);
      });
  });
}
