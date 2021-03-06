export default function readOptionsValue(options, path) {
  if (!path) {
    return undefined;
  }
  const [root, ...subPath] = path.split('.');
  if (subPath.length === 0) {
    return options[root];
  }
  if (!Object.prototype.hasOwnProperty.call(options, root)) {
    return undefined;
  }
  return readOptionsValue(options[root], subPath.join('.'));
}
