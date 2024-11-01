const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin'); // For JS minification

module.exports = merge(common, {
    mode: 'production',
    target: 'browserslist',
    output: {
        iife: true
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env'
                            ]
                        ],
                        plugins: [
                            '@babel/plugin-transform-shorthand-properties'
                        ]
                    }
                }
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,  // Extracts CSS for production
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,  // Remove comments
                    },
                },
                extractComments: false,
            }),
            new CssMinimizerPlugin() // Minifies CSS
        ],
        splitChunks: {
            chunks: 'all', // Code splitting for JS to improve caching
        },
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'dist/css/[name].css', // Outputs CSS to web/css
        }),
        new CssMinimizerPlugin()
    ]
});
