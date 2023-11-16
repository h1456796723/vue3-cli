const { Configuration } = require('webpack')
const path = require('path')
const os = require('os')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader/dist/index')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
//进度条插件
const WebpackBar = require('webpackbar')
const CopyPlugin = require('copy-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
// 代码压缩
const TerserWebpackPlugin = require('terser-webpack-plugin')
// 压缩图片
const ImageMinimizerWebpackPlugin = require('image-minimizer-webpack-plugin')

// 需要通过 cross-env 定义环境变量
const isProduction = process.env.NODE_ENV === "production"

// cpu核心数量
const threads = os.cpus().length

const getStyleLoaders = (preProcessor) => {
  return [
    isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader',
    'css-loader',
    // css 兼容处理
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['postcss-preset-env']
        }
      }
    },
    preProcessor && {
      loader: preProcessor
    }
  ].filter(Boolean)
}

/**
 * @type {Configuration} // 配置智能提示
 */
module.exports = {
  entry: './src/main.ts',
  output: {
    path: isProduction ? path.resolve(__dirname, 'dist') : undefined,
    filename: isProduction ? 'js/[name].[contenthash:10].js' : 'js/[name].js',
    // 异步加载的文件
    chunkFilename: isProduction ? 'js/[name].[contenthash:10].chunk.js' : 'js/[name].chunk.js',
    // 静态文件
    assetModuleFilename: 'asset/[hash:10][ext][query]',
    clean: true,
    pathinfo: false,
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader', // 内部会给vue文件注入HMR功能代码
        options: {
          // 开启缓存
          cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/vue-loader'),
        }
      },
      {
        test: /\.css$/,
        use: getStyleLoaders()
      },
      {
        test: /\.less$/,
        use: getStyleLoaders('less-loader')
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true, // 开启babel编译缓存
          cacheCompression: false, // 缓存文件不要压缩

        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue/],
        }
      },
      {
        test: /\.s[ac]ss$/,
        use: getStyleLoaders('sass-loader')
      },
      {
        test: /.(png|jpe?g|gif|svg)$/,
        type: 'asset/imgs',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 图片大于10*1024进行base54转码
          }
        },
        generator: {
          filename: 'asset/imgs/[hash][ext][query]' // 局部指定输出位置
        }
      },
      {
        test: /\.(ttf|woff2?|mp4|mp3|avi)$/,
        type: 'asset/resource',
        generator: {
          filename: 'asset/media/[hash][ext][query]'
        }
      },
      {
        test: /\.(ttf|woff2?)$/,
        type: 'asset/resource',
        generator: {
          filename: 'asset/fonts/[hash][ext][query]'  // 局部指定输出位置
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true, // 开启optionAPI
      __VUE_PROD_DEVTOOLS__: false,
      'process.env': {
        VUE_APP_HOST: isProduction  // 将属性转化为全局变量，让代码中可以正常访问
      }
    }),
    new CleanWebpackPlugin(), // 清除上次打包的产物
    new WebpackBar(),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist'),
          toType: 'dir',
          noErrorOnMissing: true,
          globOptions: {
            ignore: ['**/index.html'],
          },
          info: {
            minimized: true,
          }
        }
      ]
    }),
    // 提取css成单独文件
    isProduction &&
    new MiniCssExtractPlugin({
      // 定义输出文件名和目录
      filename: 'asset/css/[name].[hash:10].css',
      chunkFilename: 'asset/css/[name].[contenthash:10].css'
    }),

  ].filter(Boolean),
  // 代码处理
  optimization: {
    // 告知webpack使用TerserPlugin 或其它在 optimization.minimizer定义的插件压缩 bundle
    minimize: isProduction,
    // 压缩的操作
    minimizer: [
      new CssMinimizerPlugin(),  // 压缩css
      // 当前生产模式下会默认开启TerserPlugin，压缩javascript，但是我们需要其它配置，就需要重写了
      new TerserWebpackPlugin({
        parallel: threads, // 开启多进程处理，填入数字是开启几个线程
        terserOptions: {
          compress: {
            drop_console: true, // 删除所有的console.log语句
          }
        }
      }),
      // 压缩图片
      new ImageMinimizerWebpackPlugin({
        minimizer: {
          implementation: ImageMinimizerWebpackPlugin.imageminGenerate,
          options: {
            plugins: [
              ['gifsicle', { interlaced: true }],
              ['jpegtran', { progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
              [
                'svg0',
                {
                  plugins: [
                    'preset-default',
                    'prefixIds',
                    {
                      name: 'sortAttrs',
                      params: {
                        xmlnsOrder: 'alphabetical'
                      }
                    }
                  ]
                }
              ]
            ]
          }
        }
      })
    ],
    // 拆包区域
    splitChunks: {
      chunks: 'all',  // 指定打包加载是同步加载还是异步加载
      // name: '[id].[hash:10]',  // 如果名字有冲突可以设置一个单独的名字
      // name: '[name].[chunkhash:10]',
      cacheGroups: {
        // elementplus
        // elementplus: {
        //   name: 'chunk-elementplus',
        //   test: /[\\/]node_modules[\\/]_?element-pluse(.*)/,
        //   priority: 30,
        // },
        // 将vue 相关的代码库单独打包，减少node_modules的chunk体积
        vue: {
          name: 'vue',
          test: /[\\/]node_modules[\\/]vue(.*)/,
          chunks: 'initial',
          priority: 20,
        },
        libs: {
          name: 'chunk-libs',
          test: /[\\/]node_modules[\\/]/,
          priority: 10, // 权重最低，优先考虑前面的内容
          chunks: 'initial',
        }
      }
    },
    // 为运行时代码创建一个额外的 chunk,减少 entry chunk 体积，提高性能
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    // 需要解析的文件类型列表。由于 webpack 的解析顺序是从左到右，因此要将使用频率高的文件类型放在左侧，如下我将 vue 放在最左侧。
    extensions: ['.vue', '.ts', '.js', '.tsx', '.json'],
    // 指定查找依赖包目录
    modules: ['node_modules'],
    fallback: { "stream": false },  // vue-loader 相关报错解决办法
  },
  mode: isProduction ? 'production' : 'development',
  devServer: {
    port: 3000,
    open: true,
    hot: true, // 热模块更新
    compress: true,
    historyApiFallback: true, // 解决 vue-loader 刷新404问题
  },
  // 错误代码信息标注，第一个是行，第二个是行加列，关闭默认按照最大性能处理，开启方便查错
  devtool: isProduction ? 'source-map' : 'cheap-source-map',
  performance: false
}