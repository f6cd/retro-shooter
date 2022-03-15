const paths = require('./paths');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ProvidePlugin } = require('webpack');

module.exports = {
    entry: paths.src + "/index.js",
    output: {
        chunkFilename: "[name]-[contenthash].js",
        filename: "[name]-[contenthash].js",
        assetModuleFilename: "[name]-[contenthash][ext][query]",
        path: paths.build,
    },
    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[path][name].[ext]?hash=[hash:20]',
                            limit: 8192
                        }
                    }
                ]
            },
            {
                // Load all resources.
                test: /\.(eot|woff|woff2|svg|ttf)([?]?.*)$/,
                use: ['file-loader'],
                exclude: [paths.assets],
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: paths.src + "/index.html",
        }),
        new CopyWebpackPlugin({
            patterns: [{
                from: paths.assets,
                to: 'assets',
                globOptions: {
                    ignore: ['**/*.DS_Store', "**/*.blend", "**/*.blend1", "**/*.mtl"],
                },
                noErrorOnMissing: false
            }]
        }),
    ],
}