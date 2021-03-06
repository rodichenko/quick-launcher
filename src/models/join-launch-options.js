/* eslint-disable max-len */
import parseUserDefinedLaunchOptions from './parse-user-defined-launch-options';

/**
 * Returns {isntance_size, limitMountsPlaceholders: {placeholder: value}}; user-defined options have highest priority
 * @param appSettings
 * @param userDefinedOptions
 * @param gatewaySpecOptions
 * @return {any}
 */
export default function joinLaunchOptions(appSettings, userDefinedOptions, gatewaySpecOptions) {
  const userDefinedOptionsParsed = parseUserDefinedLaunchOptions(appSettings, userDefinedOptions);
  // eslint-disable-next-line no-underscore-dangle
  const priority = userDefinedOptions?.__launch__
    ? [
      userDefinedOptionsParsed?.limitMountsPlaceholders || {},
      gatewaySpecOptions?.limitMountsPlaceholders || {},
    ]
    : [
      gatewaySpecOptions?.limitMountsPlaceholders || {},
      userDefinedOptionsParsed?.limitMountsPlaceholders || {},
    ];
  const limitMountsPlaceholders = Object.assign(
    {},
    ...priority,
  );
  return {

    ...gatewaySpecOptions || {},
    ...userDefinedOptionsParsed,
    limitMountsPlaceholders,
  };
}
