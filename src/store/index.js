// 入口文件
import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import state from './state'
import mutations from './mutations'
import createLogger from 'vuex/dist/logger'

// 注册
Vue.use(Vuex)

// 线上线下调试规则
const debug = process.env.NODE_ENV !== 'production'
// new 一个实例
export default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  strict: debug,
  plugins: debug ? [createLogger()] : []
})
