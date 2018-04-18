const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const { resolve, join } = require('path');

const ROOT = resolve(__dirname, '..');

module.exports = {
  mode: 'development',
  entry: join(ROOT, 'src', 'index.js'),
  output: {
    path: resolve(ROOT, 'dist'),
    filename: 'mobius-client.js',
    library: 'MobiusClient',
  },
  externals: {
    'stellar-sdk': 'StellarSdk',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.IgnorePlugin(/ed25519/),
  ],
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
  },
};
