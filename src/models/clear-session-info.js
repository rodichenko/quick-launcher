import parseStoragePlaceholder from './parse-storage-placeholder';
import whoAmI from './cloud-pipeline-api/who-am-i';
import processString from './process-string';
import removeStorageFolder from './cloud-pipeline-api/remove-storage-folder';

export default function clearSessionInfo(
  application,
  appSettings,
  options,
) {
  return new Promise((resolve, reject) => {
    if (
      application
      && appSettings
      && appSettings.sessionInfoStorage
      && appSettings.sessionInfoPath
    ) {
      whoAmI()
        .then((userPayload) => {
          const user = userPayload?.payload;
          const dataStorageId = parseStoragePlaceholder(
            appSettings.sessionInfoStorage,
            undefined,
            user,
          );
          if (!Number.isNaN(Number(dataStorageId))) {
            let path = processString(appSettings.sessionInfoPath, options);
            if (path.startsWith('/')) {
              path = path.slice(1);
            }
            console.log('Removing path', path, 'at storage:', dataStorageId);
            removeStorageFolder(
              dataStorageId,
              path,
            )
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error(`Unknown session info storage: ${appSettings.sessionInfoStorage}`));
          }
        })
        .catch(reject);
    } else if (!application) {
      reject(new Error('application is not set'));
    } else if (!appSettings) {
      reject(new Error('settings are not set'));
    } else if (!application.sessionInfoStorage) {
      reject(new Error('sessionInfoStorage is not set'));
    } else if (!application.sessionInfoPath) {
      reject(new Error('sessionInfoPath is not set'));
    } else {
      reject(new Error('Missing session info'));
    }
  });
}
