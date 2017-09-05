module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  entry:  __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist/',
    publicPath: '',
    filename: 'bundle.js'
  }
};
