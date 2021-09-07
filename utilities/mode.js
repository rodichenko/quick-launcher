const isDevelopmentMode = `${process.env.WEBPACK_DEV_SERVER}` === 'true'
  || `${process.env.WEBPACK_SERVE}` === 'true';
const isProductionMode = !isDevelopmentMode;

module.exports = {
  isDevelopmentMode,
  isProductionMode,
};
