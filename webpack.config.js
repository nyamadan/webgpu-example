const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const options = {
  mode: process.env["NODE_ENV"] || "development",

  target: "web",

  entry: {
    index: './src/index.tsx',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public')
  },

  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader"
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader" // creates style nodes from JS strings
          },
          {
            loader: "css-loader", // translates CSS into CommonJS
            options: {
              sourceMap: process.env.NODE_ENV !== "production",
              modules: true
            }
          },
          {
            loader: "sass-loader", // compiles Sass to CSS
            options: {
              sourceMap: process.env.NODE_ENV !== "production"
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "WebGPU Example",
      template: "./template/index.ejs"
    })
  ],
  devServer: {
    contentBase: path.join(__dirname, 'static'),
    host: '0.0.0.0'
  }
};

if (process.env.NODE_ENV !== "production") {
  options.devtool = "source-map";
  options.module.rules.push({
    enforce: "pre",
    test: /\.js$/,
    loader: "source-map-loader"
  });
}

module.exports = options;
