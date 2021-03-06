/* eslint-disable no-underscore-dangle */
import processString from './process-string';
import getDataStorageItemContent from './cloud-pipeline-api/data-storage-item-content';
import fetchMountsForPlaceholders from './parse-limit-mounts-placeholders-config';
import parseStoragePlaceholder from './parse-storage-placeholder';

function processGatewaySpec(appSettings, content, resolve) {
  try {
    const json = JSON.parse(content);
    const {
      instance,
      ...placeholders
    } = json;
    let instanceSize;
    if (
      instance
      && appSettings.appConfigNodeSizes
      && Object.prototype.hasOwnProperty.call(appSettings, instance)
    ) {
      console.log(`Reading ${appSettings.appConfigNodeSizes[instance]} node size from gateway.spec`);
      instanceSize = appSettings.appConfigNodeSizes[instance];
    } else if (instance) {
      console.warn(`Unknown node size config: ${instance}`);
    }
    const placeholderValues = Object.entries(placeholders || {});
    if (placeholderValues.length > 0) {
      fetchMountsForPlaceholders(
        Object.entries(
          appSettings?.limitMountsPlaceholders || {},
        )
          .map(([name, config]) => ({ placeholder: name, config })),
      )
        .then((parsed) => {
          const limitMountsPlaceholders = {};
          placeholderValues.forEach(([placeholder, value]) => {
            let storageIdentifier;
            let valueParsed = false;
            if (
              appSettings?.limitMountsPlaceholders
              && appSettings?.limitMountsPlaceholders[placeholder]
            ) {
              storageIdentifier = appSettings?.limitMountsPlaceholders[placeholder].default;
            }
            if (Object.prototype.hasOwnProperty.call(parsed, placeholder)) {
              const storage = parsed[placeholder]
                .find((s) => (s.name || '').toLowerCase() === (value || '').toLowerCase());
              if (storage) {
                valueParsed = true;
                storageIdentifier = `${storage.id}`;
              }
            }
            console.log(
              `Parsing placeholder "${placeholder}" value "${value}": ${storageIdentifier} ${valueParsed ? '(parsed)' : '(default value)'}`,
            );
            if (storageIdentifier) {
              limitMountsPlaceholders[placeholder] = storageIdentifier;
            }
          });
          resolve({
            instanceSize,
            limitMountsPlaceholders,
          });
        });
    } else {
      resolve({
        instance_size: instanceSize,
      });
    }
  } catch (e) {
    console.warn(`Error parsing gateway.spec: ${e.message}`);
    resolve();
  }
}

export default function parseGatewaySpec(appSettings, options, user, currentUser) {
  if (options.__gateway_spec__) {
    return new Promise((resolve) => processGatewaySpec(
      appSettings,
      JSON.stringify(options.__gateway_spec__),
      resolve,
    ));
  }
  return new Promise((resolve) => {
    const dataStorageId = parseStoragePlaceholder(appSettings.appConfigStorage, user, currentUser);
    if (!Number.isNaN(Number(dataStorageId)) && appSettings.appConfigPath) {
      const path = processString(appSettings.appConfigPath, options);
      getDataStorageItemContent(
        dataStorageId,
        path,
      )
        .then((content) => {
          if (content) {
            console.log('Parsing gateway.spec:', content, `(storage: #${dataStorageId}; path: ${path})`);
            processGatewaySpec(appSettings, content, resolve);
          } else {
            console.warn('gateway.spec is empty', `(storage: #${dataStorageId}; path: ${path})`);
            resolve();
          }
        })
        .catch((e) => {
          console.warn(e.message);
          resolve();
        });
    } else {
      resolve();
    }
  });
}
