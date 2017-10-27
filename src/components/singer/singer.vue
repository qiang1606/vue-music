<template>
  <div class="singer" ref="singer">
    <!-- @select 监听点击事件 -->
    <list-view @select="selectSinger" :data="singers" ref="list"></list-view>
    <!--  router-view渲染子路由-->
    <router-view></router-view>
  </div>
</template>
<script>
  import { getSingerList } from 'api/singer'
  import { ERR_OK } from 'api/config'
  // 定义引入一个封装的类
  import Singer from 'common/js/singer'
  import ListView from 'base/listview/listview'
  import { mapMutations } from 'vuex'
  import { playlistMixin } from 'common/js/mixin'
  // 前10条数据定义为热门数据
  const HOT_SINGER_LEN = 10
  const HOT_NAME = '热门'
  export default {
//    共有的方法
    mixins: [playlistMixin],
    components: {
      ListView
    },
    data () {
      return {
        singers: []
      }
    },
    created () {
      this._getSingerList()
    },
    methods: {
      handlePlaylist (playlist) {
        const bottom = playlist.length > 0 ? '60px' : ''
        this.$refs.singer.style.bottom = bottom
        this.$refs.list.refresh()
      },
      selectSinger (singer) {
        this.$router.push({
          path: `/singer/${singer.id}`
        })
        this.setSinger(singer)
      },
      _getSingerList () {
        getSingerList().then((res) => {
          if (res.code === ERR_OK) {
            // 获得数据不适合，要格式化规范化数据,list是数组，里面是对象
            this.singers = this._normalizeSinger(res.data.list)
          }
        })
      },
      _normalizeSinger (list) {
        let map = {
          hot: {
            title: HOT_NAME,
            items: []
          }
        }
        list.forEach((item, index) => {
          // 如果索引小于10的添加到热门数组中
          if (index < HOT_SINGER_LEN) {
            map.hot.items.push(new Singer({
              name: item.Fsinger_name,
              id: item.Fsinger_mid
            }))
          }
          // 数据聚合
          const key = item.Findex
          // 如果Key不在map里，就创建一个对象赋值
          if (!map[key]) {
            // 创建一个对象
            map[key] = {
              title: key,
              items: []
            }
          }
          // 给map[key]这个对象就添加数据
          map[key].items.push(new Singer({
            name: item.Fsinger_name,
            id: item.Fsinger_mid
          }))
        })
        // 对象的遍历是无序的
        // 为了得到有序列表，我们需要处理 map
        // 剩余数组
        let ret = []
        // 热门数组
        let hot = []
        // 循环Map
        for (let key in map) {
          let val = map[key]
          if (val.title.match(/[a-zA-Z]/)) {
            ret.push(val)
          } else if (val.title === HOT_NAME) {
            hot.push(val)
          }
        }
        // 数组中对象的排序按照里面的属性
        ret.sort((a, b) => {
          return a.title.charCodeAt(0) - b.title.charCodeAt(0)
        })
        // 拼接数组
        return hot.concat(ret)
      },
      // 写数据
      ...mapMutations({
        setSinger: 'SET_SINGER'
      })
    }
  }

</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  .singer
    position: fixed
    top: 88px
    bottom: 0
    width: 100%
</style>
