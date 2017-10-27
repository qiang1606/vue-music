<template>
  <div class="progress-bar" ref="progressBar" @click="progressClick">
    <div class="bar-inner">
      <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper" ref="progressBtn"
           @touchstart.prevent="progressTouchStart"
           @touchmove.prevent="progressTouchMove"
           @touchend="progressTouchEnd"
      >
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>
<script type="text/ecmascript-6">
  import {prefixStyle} from 'common/js/dom'
  // 进度条小球的宽度
  const progressBtnWidth = 16
  const transform = prefixStyle('transform')
  export default {
    props: {
//      传进来，进度条的百分比
      percent: {
        type: Number,
        default: 0
      }
    },
    watch: {
      percent(newPercent) {
//        不拖动按钮的情况下可以改变percent
        if (newPercent >= 0 && !this.touch.initiated) {
          const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth
          const offsetWidth = newPercent * barWidth
          this._offset(offsetWidth)
        }
      }
    },
    created() {
//        记录不同函数之间通信共享数据
      this.touch = {}
    },
    methods: {
      progressTouchStart(e) {
//          触摸之后设置
        this.touch.initiated = true
//          第一次触摸的位置
        this.touch.startX = e.touches[0].pageX
//          触摸之前的位置
        this.touch.left = this.$refs.progress.clientWidth
      },
      progressTouchMove(e) {
        if (!this.touch.initiated) {
          return
        }
//          触摸的偏移
        const deltaX = e.touches[0].pageX - this.touch.startX
//          触摸之后应该的位置
        const offsetWidth = Math.min(this.$refs.progressBar.clientWidth - progressBtnWidth, Math.max(0, this.touch.left + deltaX))
//          修改按钮和进度相应的样式
        this._offset(offsetWidth)
      },
      progressTouchEnd() {
        this.touch.initiated = false
        this._triggerPercent()
      },
//      进度条点击事件
      progressClick(e) {
//        元素左边距离页面左边的距离rect.left
        const rect = this.$refs.progressBar.getBoundingClientRect()
//        点击的偏移位置
        const offsetWidth = e.pageX - rect.left
        this._offset(offsetWidth)
        // 这里当我们点击 progressBtn 的时候，e.offsetX 获取不对
        // this._offset(e.offsetX)
        this._triggerPercent()
      },
      _triggerPercent() {
        const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth
//       拖动之后的bar的宽度的实时百分比
        const percent = this.$refs.progress.clientWidth / barWidth
//        百分比传出去
        this.$emit('percentChange', percent)
      },
      _offset(offsetWidth) {
        //          进度条
        this.$refs.progress.style.width = `${offsetWidth}px`
        //          进度条小球
        this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px,0,0)`
      }
    }

  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .progress-bar
    height: 30px
    .bar-inner
      position: relative
      top: 13px
      height: 4px
      background: rgba(0, 0, 0, 0.3)
      .progress
        position: absolute
        height: 100%
        background: $color-theme
      .progress-btn-wrapper
        position: absolute
        left: -8px
        top: -13px
        width: 30px
        height: 30px
        .progress-btn
          position: relative
          top: 7px
          left: 7px
          box-sizing: border-box
          width: 16px
          height: 16px
          border: 3px solid $color-text
          border-radius: 50%
          background: $color-theme
</style>
