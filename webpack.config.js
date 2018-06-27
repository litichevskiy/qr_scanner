const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

module.exports = {
  entry: ['./src/js/index.js', './src/style/index.scss'],
  output: {
    path: path.resolve(__dirname, './dist/js'),
    filename: 'bundle.js'
  },
  resolve: {
      extensions: ['.scss', '.js', ' '],
  },
  plugins: [
    new ExtractTextPlugin('../css/bundle.css')
  ],
  node: {
    fs: 'empty',
  },
  devtool: 'source-map',
  watch: !IS_PRODUCTION,
  module: {
    rules: [
      {
        exclude: /\/node_modules\//,
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: !IS_PRODUCTION ,
                minimize:  IS_PRODUCTION,
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                  plugins: [
                      autoprefixer({
                          browsers:['last 5 version']
                      })
                  ],
                  sourceMap: !IS_PRODUCTION
              }
            },
            {
              loader: 'sass-loader',
              options: { sourceMap: !IS_PRODUCTION }
            }
          ]
        })
      }
    ]
  }
};