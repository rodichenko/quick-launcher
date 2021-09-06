export default function parseUserDefinedLaunchOptions(appSettings, options) {
  const {
    nodeSize,
    ...result
  } = options || {};
  if (
    nodeSize
    && appSettings
    && Object.prototype.hasOwnProperty.call(appSettings, nodeSize)
  ) {
    result.instance_size = appSettings.appConfigNodeSizes[options.nodeSize];
  }
  return result;
}
