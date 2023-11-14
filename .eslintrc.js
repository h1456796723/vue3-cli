module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/vueessential', 'eslint:recommended'],  // 继承vue插件规则和 Eslint 规则
  parserOptions: {
    parser: '@babel/eslint-parser'
  }
}