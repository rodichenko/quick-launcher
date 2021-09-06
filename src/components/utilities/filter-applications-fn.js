function removeSlashes(string = '') {
  if (!string) {
    return '';
  }
  let modifiedString = string;
  if (modifiedString.startsWith('/')) {
    modifiedString = modifiedString.slice(1);
  }
  if (modifiedString.endsWith('/')) {
    modifiedString = modifiedString.slice(0, -1);
  }
  return modifiedString.toLowerCase();
}

export default function filterAppFn(filter) {
  const path = removeSlashes(filter);
  return function filterFn(app) {
    return !filter
      || (app.name || '').toLowerCase().includes(filter.toLowerCase())
      || (app.description || '').toLowerCase().includes(filter.toLowerCase())
      || (app.path && removeSlashes(app.path) === path)
      || (app.info?.path && removeSlashes(app.info?.path) === path)
      || (app.info?.user || '').toLowerCase().includes(filter.toLowerCase())
      || !!Object.values(app.info?.ownerInfo || {})
        .map((o) => o.toLowerCase())
        .find((o) => o.includes(filter.toLowerCase()));
  };
}
