const path = require('path');
const fs = require('fs');
const { isDevelopmentMode, isProductionMode } = require('./mode');

function readEnvVarsFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath)
        .toString()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [name, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();
          return {
            name: name.trim(),
            value,
          };
        })
        .reduce((r, c) => ({ ...r, [c.name]: c.value }), {});
      // eslint-disable-next-line no-empty
    } catch (_) {}
  }
  return {};
}

function joinEnvVars(vars1, vars2) {
  const vars = { ...vars1 };
  const keys = Object.keys(vars2);
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    if (vars2[key] !== undefined) {
      vars[key] = vars2[key];
    }
  }
  return vars;
}

const ENV_VARS = [
  'WEBPACK_DEV_SERVER',
  'CP_APPLICATIONS_API',
  'FAVICON',
  'BACKGROUND',
  'LOGO',
  'DARK_MODE',
  'PUBLIC_URL',
  'USE_CLOUD_PIPELINE_API',
  'CP_APPLICATIONS_TITLE',
  'CP_APPLICATIONS_TAG',
  'USE_CLOUD_PIPELINE_TOOLS',
  'INITIAL_POLLING_DELAY',
  'POLLING_INTERVAL',
  'LIMIT_MOUNTS',
  'CP_APPLICATIONS_SUPPORT_NAME',
  'USE_PARENT_NODE_ID',
  'SHOW_TIMER',
  'PRETTY_URL_DOMAIN',
  'PRETTY_URL_PATH',
];

const envVars = ENV_VARS
  .map((v) => ({ key: v, value: process.env[v] }))
  .filter((o) => o.value !== undefined)
  .reduce((r, c) => ({ ...r, [c.key]: c.value }), {});

const envVarsSources = [
  readEnvVarsFile(path.resolve(__dirname, '../.env')),
  readEnvVarsFile(path.resolve(__dirname, '../.env.local')),
  isDevelopmentMode && readEnvVarsFile(path.resolve(__dirname, '../.env.development.local')),
  isProductionMode && readEnvVarsFile(path.resolve(__dirname, '../.env.production.local')),
  envVars,
].filter(Boolean);

const env = envVarsSources
  .reduce((r, c) => joinEnvVars(r, c), {});

module.exports = env;
