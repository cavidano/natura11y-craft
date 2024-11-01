const path = require('path');

module.exports = {
    entry: {
        natura11y: [
            './src/index.js'
        ]
    },
    output: {
        filename: 'assets/js/[name].js',         // Puts JavaScript files in web/js
        path: path.resolve(__dirname, '../web'), // Outputs to web directory
        publicPath: '/'
    }
}