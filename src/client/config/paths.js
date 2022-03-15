const path = require('path')

module.exports = {
    // Source files
    src: path.resolve(__dirname, '../src'),

    // Production build files
    build: path.resolve(__dirname, '../../../build/client/'),

    // Static files that get copied to build folder
    assets: path.resolve(__dirname, '../assets'),

    // Favicon
    favicon: path.resolve(__dirname, '../src/favicon'),
}