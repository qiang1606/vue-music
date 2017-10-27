<template>
  <scroll @scroll="scroll" :listen-scroll="listenScroll" :data="data" :probe-type="probeType" class="listview" ref="listview">
    <ul>
    <!-- 给ref属性是为了操作dom -->
      <li class="list-group" v-for="group in data" ref="listGroup">
        <h2 class="list-group-title">{{group.title}}</h2>
        <ul>
          <li @click="selectItem(item)" class="list-group-item" v-for="item in group.items">
            <img v-lazy="item.avatar" class="avatar">
            <span class="name">{{item.name}}</span>
          </li>
        </ul>
      </li>
    </ul>
    <!-- h5手指触摸事件touchstart 滚动事件touchmove-->
    <div class="list-shortcut" @touchstart.stop.prevent="onShortcutTouchStart" @touchmove.stop.prevent="onShortcutTouchMove" ouchend.stop>
      <ul>
      <!-- 给每个添加 data-index属性,,,,,,,currentIndex===index与里面的某一个index相等时变色-->
        <li v-for="(item,index) in shortcutList" :data-index="index" :class="{'current':currentIndex===index}" class="item">{{item}}</li>
      </ul>
    </div>
    <!-- 滑动时标题悬浮 -->
    <div class="list-fixed" ref="fixed" v-show="fixedTitle">
      <div class="fixed-title">{{fixedTitle}}</div>
    </div>
    <!-- 网络慢时加载 -->
    <div v-show="!data.length" class="loading-container">
    	<loading></loading>
    </div>
  </scroll>
</template>
<script>
import Scroll from 'base/scroll/scroll'
import Loading from 'base/loading/loading'
import { getData } from 'common/js/dom'
// 悬浮框的高度
const TITLE_HEIGHT = 30
// 每个字的高度，字体大小＋padding
const ANCHOR_HEIGHT = 18
export default {
  components: {
    Scroll,
    Loading
  },
  props: {
    data: {
      type: Array,
      default: []
    }
  },
  computed: {
    shortcutList() {
      return this.data.map((group) => {
        // 每个title的第一个字
        return group.title.substring(0, 1)
      })
    },
    // 根据currentIndex，计算标题tilte
    fixedTitle() {
      // 边界条件
      if (this.scrollY > 0) {
        return ''
      }
      return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
    }
  },
  created() {
    this.probeType = 3
    // 记录触摸的y值，让两个函数共享，不需要被监听，或者绑定数据变化
    this.touch = {}
    this.listenScroll = true
    this.listHeight = []
  },
  data() {
    return {
      // 记录左侧实时滚动的位置
      scrollY: -1,
      // 记录右侧当前应该显示的第几个
      currentIndex: 0,
// 偏移量，控制悬浮框顶出去，优化
      diff: -1
    }
  },
  methods: {
// 点击歌手，进入详情页面
    selectItem(item) {
      this.$emit('select', item)
    },
    // 传的e就是li.item
    onShortcutTouchStart(e) {
      //  获取触摸的data-index属性值index,然后就可以根据index让左侧歌手列移动到具体位置
      let anchorIndex = getData(e.target, 'index')
      // 记录第一次触摸时的y值
      let firstTouch = e.touches[0]
      this.touch.y1 = firstTouch.pageY
      this.touch.anchorIndex = anchorIndex
      this._scrollTo(anchorIndex)
    },
    onShortcutTouchMove(e) {
      let firstTouch = e.touches[0]
      this.touch.y2 = firstTouch.pageY
// 向下取整是或0
// 获取滑动距离相对于一个字体格局高度的偏差，就是几个，索引大小
      let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0
      // 最终的落点索引，，，，this.touch.anchorIndex是字符串
      let anchorIndex = parseInt(this.touch.anchorIndex) + delta
      this._scrollTo(anchorIndex)
    },
    refresh() {
      this.$refs.listview.refresh()
    },
    scroll(pos) {
      // 获取左侧实时滚动的位置
      this.scrollY = pos.y
    },
    _scrollTo(index) {
      // 点击热的上方和z 的下方时，index为null，
      if (!index && index !== 0) {
        return
      }
      // 滑动时，index可能<0,也可能>索引数
      if (index < 0) {
        index = 0
      } else if (index > this.listHeight.length - 2) {
        index = this.listHeight.length - 2
      }
// 点击时，字母有样式,,,此时，滚动时实时记录scrollY的值
      this.scrollY = -this.listHeight[index]
      this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)
    },
    // 记录每个group的高度
    _calculateHeight() {
      this.listHeight = []
      const list = this.$refs.listGroup
      // 第一个高度为0
      let height = 0
      this.listHeight.push(height)
      // 遍历记录每个list-group的高度
      for (let i = 0; i < list.length; i++) {
        let item = list[i]
        height += item.clientHeight
        this.listHeight.push(height)
      }
    }
  },
  watch: {
    data() {
      setTimeout(() => {
        this._calculateHeight()
      }, 20)
    },
    // 通过监听每次scrollY的值判断区间，，，，向下滑动，scrollY为正值，向上滑动，scrollY为负值，，，，，scrollY的变化就会导致currentIndex的变化，从而反映dom上
    scrollY(newY) {
      const listHeight = this.listHeight
// 当滚动到顶部，newY>0
      if (newY > 0) {
        this.currentIndex = 0
        return
      }
// 在中间部分滚动
      for (let i = 0; i < listHeight.length - 1; i++) {
        // 下限
        let height1 = listHeight[i]
        // 上限
        let height2 = listHeight[i + 1]
        if (-newY >= height1 && -newY < height2) {
          this.currentIndex = i
          // 记录悬浮框的偏移量
          this.diff = height2 + newY
          return
        }
      }
// 当滚动到底部，且-newY大于最后一个元素的上限
      this.currentIndex = listHeight.length - 2
    },
    // 观测偏移量的范围，使fixed的top发生变化
    diff(newVal) {
      // 记录悬浮框的top值
      let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0
      // 判断一下，，，当滑动时，fixedTop不变时，不需要使其dom的竖直偏移
      if (this.fixedTop === fixedTop) {
        return
      }
      this.fixedTop = fixedTop
// ref属性可以获取对象修改dom的竖直偏移过渡
      this.$refs.fixed.style.transform = `translate3d(0,${fixedTop}px,0)`
    }
  }
}

</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .listview
    position: relative
    width: 100%
    height: 100%
    overflow: hidden
    background: $color-background
    .list-group
      padding-bottom: 30px
      .list-group-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
      .list-group-item
        display: flex
        align-items: center
        padding: 20px 0 0 30px
        .avatar
          width: 50px
          height: 50px
          border-radius: 50%
        .name
          margin-left: 20px
          color: $color-text-l
          font-size: $font-size-medium
    .list-shortcut
      position: absolute
      z-index: 30
      right: 0
      top: 50%
      transform: translateY(-50%)
      width: 20px
      padding: 20px 0
      border-radius: 10px
      text-align: center
      background: $color-background-d
      font-family: Helvetica
      .item
        padding: 3px
        line-height: 1
        color: $color-text-l
        font-size: $font-size-small
        &.current
          color: $color-theme
    .list-fixed
      position: absolute
      top: 0
      left: 0
      width: 100%
      .fixed-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
    .loading-container
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
