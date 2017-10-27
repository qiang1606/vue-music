<template>
  <div id="app">
    <m-header></m-header>
    <tab></tab>
    <!-- 对应router的组件渲染 可以缓存 -->
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
    <player></player>
  </div>
</template>
<script>
// 引入用单引号，，，，components前面没有./是因为做了别名的配置在webpack.base.conf.js
import MHeader from 'components/m-header/m-header'
import Tab from 'components/tab/tab'
// 由于任何页面都可以调用播放组件，所以放在全局的app.vue中
import Player from 'components/player/player'
export default {
  // components:后面要有空格
  components: {
    MHeader,
    Tab,
    Player
  }
}

</script>
<style scoped lang="stylus" rel="stylesheet/stylus">


</style>
