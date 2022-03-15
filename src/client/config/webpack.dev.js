const common = require('./webpack.common.js');

const { merge } = require('webpack-merge');
const { DefinePlugin } = require('webpack');

module.exports = merge(common, {
    devtool: 'source-map',
    devServer: {
        port: 5500,
        host: '0.0.0.0',
        allowedHosts: 'all',
        
        // disableHostCheck: true,
    },
    plugins: [
        new DefinePlugin({
            USE_LOCAL_CONNECTION: true,
        })
    ],
});