module.exports = function (options, webpack) {
  return {
    ...options,
    optimization: {
      ...options.optimization,
      minimize: false,
      concatenateModules: false,
    },
    stats: 'errors-only',
    performance: {
      hints: false,
    },
  };
};
