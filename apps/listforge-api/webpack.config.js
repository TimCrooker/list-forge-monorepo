module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      // Externalize all node_modules EXCEPT workspace packages
      function ({ request }, callback) {
        if (/^@listforge\//.test(request)) {
          // Bundle workspace packages
          return callback();
        }
        // Externalize everything else
        if (/^[a-z@][a-z0-9-@\/]*$/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],
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
