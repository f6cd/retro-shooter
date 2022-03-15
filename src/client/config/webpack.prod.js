const common = require('./webpack.common.js');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { merge } = require('webpack-merge');
const { DefinePlugin } = require('webpack');

module.exports = merge(common, {
    devtool: false,
    optimization: {
        minimize: true,
        runtimeChunk: {
            name: 'runtime',
        },
        splitChunks: {
            chunks: 'all',
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin({
            USE_LOCAL_CONNECTION: false,
        })
    ]
});