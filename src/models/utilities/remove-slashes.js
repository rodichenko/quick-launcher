export default function removeExtraSlash(path, options = {}) {
  const {
    removeLeading = true,
    removeTrailing = true,
  } = options;
  let modifiedPath = path;
  if (removeLeading && modifiedPath.startsWith('/')) {
    modifiedPath = modifiedPath.slice(1);
  }
  if (removeTrailing && modifiedPath.endsWith('/')) {
    modifiedPath = modifiedPath.slice(0, -1);
  }
  return modifiedPath;
}
