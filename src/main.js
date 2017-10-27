// es6api的转义
import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import router from './router'
// 图片懒加载
import VueLazyload from 'vue-lazyload'
import fastclick from 'fastclick'
import store from './store'

import 'common/stylus/index.styl'

Vue.config.productionTip = false

Vue.use(VueLazyload, {
  loading: require('common/image/default.png')
})

/* eslint-disable no-new */
// 屏幕点击没300ms延迟
fastclick.attach(document.body)
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
