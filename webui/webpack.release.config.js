var webpack = require('webpack');
//var OfflinePlugin = require('offline-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.min.js",
        path: __dirname + "/dist"
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [{
                test: /\.(html)$/,
                use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[ext]',
                            context: './html',
                            outputPath: '/',
                            publicPath: '/'
                        }
                    },

                ]
            },
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader"
            },
            {
                test: /\.css$/,
                loaders: ["style-loader", "css-loader"]
            },
            {
                test: /\.(jpe?g|png|gif)$/i,
                loader: "file-loader",
                query: {
                    name: '[name].[ext]',
                    outputPath: 'images/'
                }
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader",
                query: {
                    limit: '10000',
                    name: '[name].[ext]',
                    outputPath: 'fonts/'
                }
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
          title:'Tamed Beast - Ingnomia data editor'
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress:{
                warnings: false
            },
            output: {
                comments: false,
            },
        }),
//        new OfflinePlugin({
//          ServiceWorker: {
//          output: 'sw.js'
//        }})
    ]
};