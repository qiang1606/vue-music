<template>
  <div class="player" v-show="playlist.length>0">
    <transition name="normal" @enter="enter" @after-enter="afterEnter" @leave="leave" @after-leave="afterLeave">
      <div class="normal-player" v-show="fullScreen">
        <div class="background">
          <img :src="currentSong.image" width="100%" height="100%">
        </div>
        <div class="top">
          <div @click="back" class="back">
            <i class="icon-back"></i>
          </div>
          <h1 class="title" v-html="currentSong.name"></h1>
          <h2 class="subtitle" v-html="currentSong.singer"></h2>
        </div>
        <div class="middle"
             @touchstart.prevent="middleTouchStart"
             @touchmove.prevent="middleTouchMove"
             @touchend="middleTouchEnd"
        >
          <div class="middle-l" ref="middleL">
            <div class="cd-wrapper" ref="cdWrapper">
              <div class="cd" :class="cdCls">
                <img :src="currentSong.image" class="image">
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">{{playingLyric}}</div>
            </div>
          </div>
          <scroll class="middle-r" ref="lyricList" :data="currentLyric && currentLyric.lines">
            <div class="lyric-wrapper">
              <div v-if="currentLyric">
                <p class="text" ref="lyricLine" :class="{'current': currentLineNum ===index}"
                   v-for="(line, index) in currentLyric.lines">{{line.txt}}</p>
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <!--左右滑-->
          <div class="dot-wrapper">
            <span class="dot" :class="{'active':currentShow==='cd'}"></span>
            <span class="dot" :class="{'active':currentShow==='lyric'}"></span>
          </div>
          <div class="progress-wrapper">
            <!--时间格式化-->
            <span class="time time-l">{{format(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar :percent="percent" @percentChange="onProgressBarChange"></progress-bar>
            </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
          </div>
          <div class="operators">
            <div class="icon i-left" @click="changeMode">
              <i :class="iconMode"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i @click="prev" class="icon-prev"></i>
            </div>
            <div class="icon i-center" :class="disableCls">
              <i @click="togglePlaying" :class="playIcon"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i @click="next" class="icon-next"></i>
            </div>
            <div class="icon i-right">
              <i @click="toggleFavorite(currentSong)" class="icon" :class="getFavoriteIcon(currentSong)"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <transition name="mini">
      <div class="mini-player" v-show="!fullScreen" @click="open">
        <div class="icon">
          <img :class="cdCls" :src="currentSong.image" width="40" height="40">
        </div>
        <div class="text">
          <h2 class="name" v-html="currentSong.name"></h2>
          <p class="desc" v-html="currentSong.singer"></p>
        </div>
        <!--控制播放暂停,,.stop阻止事件向上冒泡-->
        <div class="control">
          <progress-circle :radius="radius" :percent="percent">
            <i @click.stop="togglePlaying" class="icon-mini" :class="miniIcon"></i>
          </progress-circle>
        </div>
        <div class="control" @click.stop="showPlaylist">
          <i class="icon-playlist"></i>
        </div>
      </div>
    </transition>
    <play-list ref="playlist"></play-list>
    <!--播放功能，，监听currentSong.url变化时，播放-->
    <audio ref="audio" :src="currentSong.url" @play="ready" @error="error" @timeupdate="updateTime"
           @ended="end"></audio>
  </div>
</template>
<script type="text/ecmascript-6">
  //   mapGetters数据映射到组件上
  import { mapGetters, mapMutations, mapActions } from 'vuex'
  import animations from 'create-keyframe-animation'
  import { prefixStyle } from 'common/js/dom'
  import ProgressBar from 'base/progress-bar/progress-bar'
  import ProgressCircle from 'base/progress-circle/progress-circle'
  import { playMode } from 'common/js/config'
  import Scroll from 'base/scroll/scroll'
  import PlayList from 'components/playlist/playlist'
  //  解析歌词
  import Lyric from 'lyric-parser'
  import { playerMixin } from 'common/js/mixin'

  const transform = prefixStyle('transform')
  const transitionDuration = prefixStyle('transitionDuration')
  export default {
    mixins: [playerMixin],
    components: {
      ProgressBar,
      ProgressCircle,
      Scroll,
      PlayList
    },
    data () {
      return {
        songReady: false,
//        当前播放的时间
        currentTime: 0,
//        环状进度条的半径
        radius: 32,
        currentLyric: null,
        currentLineNum: 0,
        currentShow: 'cd',
        playingLyric: ''
      }
    },
    computed: {
//      图片旋转暂停的class
      cdCls () {
        return this.playing ? 'play' : 'play pause'
      },
//      修改播放和暂停图标的样式显示的class
      playIcon () {
        return this.playing ? 'icon-pause' : 'icon-play'
      },
//      缩小时，播放和暂停图标的样式
      miniIcon () {
        return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
      },
//      网慢或者出错时，播放按钮变灰
      disableCls () {
        return this.songReady ? '' : 'disable'
      },
      percent () {
        return this.currentTime / this.currentSong.duration
      },
      ...mapGetters([
        'fullScreen',
        'playing',
        'currentIndex'
      ])
    },
    methods: {
//      全屏收起
      back () {
//        修改数据引入mapMutations中的方法，调用即可修改数据，
        this.setFullScreen(false)
      },
//      点击小屏播放框时，全屏播放显示
      open () {
        this.setFullScreen(true)
      },
//      生成动画图片飞出
      enter (el, done) {
//        获取位置
        const {x, y, scale} = this._getPosAndScale()
//        定义动画
        let animation = {
//          起初
          0: {
            transform: `translate3d(${x}px,${y}px,0) scale(${scale})`
          },
//          60%时间
          60: {
            transform: `translate3d(0,0,0) scale(1.1)`
          },
//          100%，完成
          100: {
            transform: `translate3d(0,0,0) scale(1)`
          }
        }
//             注册动画
        animations.registerAnimation({
          name: 'move',
          animation,
          presets: {
//            动画时间
            duration: 400,
//            动画类型
            easing: 'linear'
          }
        })

//        运行,,dom元素cdWrapper
        animations.runAnimation(this.$refs.cdWrapper, 'move', done)
      },
      afterEnter () {
        animations.unregisterAnimation('move')
//        animation清空
        this.$refs.cdWrapper.style.animation = ''
      },
      leave (el, done) {
        this.$refs.cdWrapper.style.transition = 'all 0.4s'
        const {x, y, scale} = this._getPosAndScale()
        this.$refs.cdWrapper.style[transform] = `translate3d(${x}px,${y}px,0) scale(${scale})`
//        动画完成
        this.$refs.cdWrapper.addEventListener('transitionend', done)
      },
      afterLeave () {
//        完成时清空
        this.$refs.cdWrapper.style.transition = ''
        this.$refs.cdWrapper.style[transform] = ''
      },
//      暂停，播放
      togglePlaying () {
//        如果没有加载好，不操作,,,目的是阻止快速点击没有加载好出错
        if (!this.songReady) {
          return
        }
//        修改状态，通过mapMutations修改，监听playing变化再次修改
        this.setPlayingState(!this.playing)
//        暂停，播放时，停止歌词的自动滑动
        if (this.currentLyric) {
          this.currentLyric.togglePlay()
        }
      },
      //      移动播放按钮，audio播放完时，要自动继续播放下一首或者单曲循环
      end () {
        if (this.mode === playMode.loop) {
          this.loop()
        } else {
          this.next()
        }
      },
      loop () {
//        当前播放时间置为0
        this.$refs.audio.currentTime = 0
        this.$refs.audio.play()
        this.setPlayingState(true)
//        循环播放时，歌词回到最初
        if (this.currentLyric) {
          this.currentLyric.seek(0)
        }
      },
//      上一首
      prev () {
//        目的是阻止快速点击没有加载好出错
        if (!this.songReady) {
          return
        }
        if (this.playlist.length === 1) {
          this.loop()
          return
        } else {
          let index = this.currentIndex - 1
          if (index === -1) {
            index = this.playlist.length - 1
          }
          this.setCurrentIndex(index)
//        如果歌曲暂停，修改播放按钮的状态
          if (!this.playing) {
            this.togglePlaying()
          }
        }
//        点击完之songReady 后置为false
        this.songReady = false
      },
//      下一首
      next () {
        if (!this.songReady) {
          return
        }
//        歌曲如果只有一首时，循环
        if (this.playlist.length === 1) {
          this.loop()
          return
        } else {
//        下面的currentIndex从getters中获取
          let index = this.currentIndex + 1
//       最后一首时
          if (index === this.playlist.length) {
            index = 0
          }
//        修改从Mutations中
          this.setCurrentIndex(index)
          if (!this.playing) {
            this.togglePlaying()
          }
        }
        this.songReady = false
      },
//      歌曲加载完毕时，才可以下一首
      ready () {
        this.songReady = true
//        记录播放历史列表数组中
        this.savePlayHistory(this.currentSong)
      },
//      错误时也能跳过去继续
      error () {
        this.songReady = true
      },
//      audio播放时会派发一个事件,currentTime当前播放时间
      updateTime (e) {
//        可以获取，也可以设置
        this.currentTime = e.target.currentTime
      },
//      格式化时间格式
      format (interval) {
//        或0是向下取整
        interval = interval | 0
        const minute = interval / 60 | 0
        const second = this._pad(interval % 60)
        return `${minute}:${second}`
      },
//      监听内部传的percent，进行修改播放时间
      onProgressBarChange (percent) {
        const currentTime = this.currentSong.duration * percent
//        修改歌曲的当前时间
        this.$refs.audio.currentTime = currentTime
//        拖到某一位置开始播放
        if (!this.playing) {
          this.togglePlaying()
        }
//        拖动滚动条时，歌词同步
        if (this.currentLyric) {
//
          this.currentLyric.seek(currentTime * 1000)
        }
      },
//      获取歌词
      getLyric () {
        this.currentSong.getLyric().then((lyric) => {
//          没有歌词时，返回
          if (this.currentSong.lyric !== lyric) {
            return
          }
          this.currentLyric = new Lyric(lyric, this.handleLyric)
//          播放时，歌词播放
          if (this.playing) {
            this.currentLyric.play()
          }
        }).catch(() => {
          this.currentLyric = null
          this.playingLyric = ''
          this.currentLineNum = 0
        })
      },
//      获取到歌词的回调函数
      handleLyric ({lineNum, txt}) {
        this.currentLineNum = lineNum
//        歌词的滚动
        if (lineNum > 5) {
          let lineEl = this.$refs.lyricLine[lineNum - 5]
          this.$refs.lyricList.scrollToElement(lineEl, 1000)
        } else {
          this.$refs.lyricList.scrollTo(0, 0, 1000)
        }
//        当前歌词显示
        this.playingLyric = txt
      },
//      显示播放歌曲列表
      showPlaylist () {
        this.$refs.playlist.show()
      },
//      屏幕左右滑动事件
      middleTouchStart (e) {
        this.touch.initiated = true
        // 用来判断是否是一次移动
        this.touch.moved = false
        const touch = e.touches[0]
        this.touch.startX = touch.pageX
        this.touch.startY = touch.pageY
      },
      middleTouchMove (e) {
        if (!this.touch.initiated) {
          return
        }
        const touch = e.touches[0]
        const deltaX = touch.pageX - this.touch.startX
        const deltaY = touch.pageY - this.touch.startY
//        判断，因为还有上下的歌词滚动，哪个距离大，就是往哪方向滑动
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return
        }
        if (!this.touch.moved) {
          this.touch.moved = true
        }
        const left = this.currentShow === 'cd' ? 0 : -window.innerWidth
        const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX))
        this.touch.percent = Math.abs(offsetWidth / window.innerWidth)
        this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        this.$refs.lyricList.$el.style[transitionDuration] = 0
        this.$refs.middleL.style.opacity = 1 - this.touch.percent
        this.$refs.middleL.style[transitionDuration] = 0
      },
      middleTouchEnd () {
        if (!this.touch.moved) {
          return
        }
        let offsetWidth
        let opacity
        if (this.currentShow === 'cd') {
          if (this.touch.percent > 0.1) {
            offsetWidth = -window.innerWidth
            opacity = 0
            this.currentShow = 'lyric'
          } else {
            offsetWidth = 0
            opacity = 1
          }
        } else {
          if (this.touch.percent < 0.9) {
            offsetWidth = 0
            this.currentShow = 'cd'
            opacity = 1
          } else {
            offsetWidth = -window.innerWidth
            opacity = 0
          }
        }
        const time = 300
        this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        this.$refs.lyricList.$el.style[transitionDuration] = `${time}ms`
        this.$refs.middleL.style.opacity = opacity
        this.$refs.middleL.style[transitionDuration] = `${time}ms`
        this.touch.initiated = false
      },
//      一位数时前面补0，，时间：2：02
      _pad (num, n = 2) {
        let len = num.toString().length
        while (len < n) {
          num = '0' + num
          len++
        }
        return num
      },
//      获取初始位置，两个位置的偏移
      _getPosAndScale () {
//        下方的宽度
        const targetWidth = 40
//        下方距离左侧距离
        const paddingLeft = 40
//        下方距离底侧距离
        const paddingBottom = 30
//        中间图片距离顶部距离，不是中心开始，是边界
        const paddingTop = 80
//        中间图片宽度
        const width = window.innerWidth * 0.8
//        缩放比例
        const scale = targetWidth / width
//        x轴之差
        const x = -(window.innerWidth / 2 - paddingLeft)
//        y轴
        const y = window.innerHeight - paddingTop - width / 2 - paddingBottom
        return {
          x,
          y,
          scale
        }
      },
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN',
        setPlayingState: 'SET_PLAYING_STATE',
        setCurrentIndex: 'SET_CURRENT_INDEX',
        setPlayMode: 'SET_PLAY_MODE',
        setPlayList: 'SET_PLAYLIST'
      }),
      ...mapActions([
        'savePlayHistory'
      ])
    },
    created () {
      this.touch = {}
    },
    watch: {
      currentSong (newSong, oldSong) {
//        如果没有歌曲时，不做什么,不再播放
        if (!newSong.id) {
          return
        }
//        改变时还是同一首歌，不执行下面的代码
        if (newSong.id === oldSong.id) {
          return
        }
//        切换歌曲时，清空定时器
        if (this.currentLyric) {
          this.currentLyric.stop()
          this.currentTime = 0
          this.playingLyric = ''
          this.currentLineNum = 0
        }
        clearTimeout(this.timer)
//        延时才可以播放
        this.timer = setTimeout(() => {
          this.$refs.audio.play()
          this.getLyric()
        }, 1000)
      },
      playing (newPlaying) {
        const audio = this.$refs.audio
//        $nextTick，，dom更新之后立即执行回调
        this.$nextTick(() => {
//          play() pause()都是audio的方法
          newPlaying ? audio.play() : audio.pause()
        })
      }
    }
  }
</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .player
    .normal-player
      position: fixed
      left: 0
      right: 0
      top: 0
      bottom: 0
      z-index: 150
      background: $color-background
      .background
        position: absolute
        left: 0
        top: 0
        width: 100%
        height: 100%
        z-index: -1
        opacity: 0.6
        filter: blur(20px)
      .top
        position: relative
        margin-bottom: 25px
        .back
          position absolute
          top: 0
          left: 6px
          z-index: 50
          .icon-back
            display: block
            padding: 9px
            font-size: $font-size-large-x
            color: $color-theme
            transform: rotate(-90deg)
        .title
          width: 70%
          margin: 0 auto
          line-height: 40px
          text-align: center
          no-wrap()
          font-size: $font-size-large
          color: $color-text
        .subtitle
          line-height: 20px
          text-align: center
          font-size: $font-size-medium
          color: $color-text
      .middle
        position: fixed
        width: 100%
        top: 80px
        bottom: 170px
        white-space: nowrap
        font-size: 0
        .middle-l
          display: inline-block
          vertical-align: top
          position: relative
          width: 100%
          height: 0
          padding-top: 80%
          .cd-wrapper
            position: absolute
            left: 10%
            top: 0
            width: 80%
            height: 100%
            .cd
              width: 100%
              height: 100%
              box-sizing: border-box
              border: 10px solid rgba(255, 255, 255, 0.1)
              border-radius: 50%
              &.play
                animation: rotate 20s linear infinite
              &.pause
                animation-play-state: paused
              .image
                position: absolute
                left: 0
                top: 0
                width: 100%
                height: 100%
                border-radius: 50%

          .playing-lyric-wrapper
            width: 80%
            margin: 30px auto 0 auto
            overflow: hidden
            text-align: center
            .playing-lyric
              height: 20px
              line-height: 20px
              font-size: $font-size-medium
              color: $color-text-l
        .middle-r
          display: inline-block
          vertical-align: top
          width: 100%
          height: 100%
          overflow: hidden
          .lyric-wrapper
            width: 80%
            margin: 0 auto
            overflow: hidden
            text-align: center
            .text
              line-height: 32px
              color: $color-text-l
              font-size: $font-size-medium
              &.current
                color: $color-text
      .bottom
        position: absolute
        bottom: 50px
        width: 100%
        .dot-wrapper
          text-align: center
          font-size: 0
          .dot
            display: inline-block
            vertical-align: middle
            margin: 0 4px
            width: 8px
            height: 8px
            border-radius: 50%
            background: $color-text-l
            &.active
              width: 20px
              border-radius: 5px
              background: $color-text-ll
        .progress-wrapper
          display: flex
          align-items: center
          width: 80%
          margin: 0px auto
          padding: 10px 0
          .time
            color: $color-text
            font-size: $font-size-small
            flex: 0 0 30px
            line-height: 30px
            width: 30px
            &.time-l
              text-align: left
            &.time-r
              text-align: right
          .progress-bar-wrapper
            flex: 1
        .operators
          display: flex
          align-items: center
          .icon
            flex: 1
            color: $color-theme
            &.disable
              color: $color-theme-d
            i
              font-size: 30px
          .i-left
            text-align: right
          .i-center
            padding: 0 20px
            text-align: center
            i
              font-size: 40px
          .i-right
            text-align: left
          .icon-favorite
            color: $color-sub-theme
      &.normal-enter-active, &.normal-leave-active
        transition: all 0.4s
        .top, .bottom
          transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
      &.normal-enter, &.normal-leave-to
        opacity: 0
        .top
          transform: translate3d(0, -100px, 0)
        .bottom
          transform: translate3d(0, 100px, 0)
    .mini-player
      display: flex
      align-items: center
      position: fixed
      left: 0
      bottom: 0
      z-index: 180
      width: 100%
      height: 60px
      background: $color-highlight-background
      &.mini-enter-active, &.mini-leave-active
        transition: all 0.4s
      &.mini-enter, &.mini-leave-to
        opacity: 0
      .icon
        flex: 0 0 40px
        width: 40px
        padding: 0 10px 0 20px
        img
          border-radius: 50%
          &.play
            animation: rotate 10s linear infinite
          &.pause
            animation-play-state: paused
      .text
        display: flex
        flex-direction: column
        justify-content: center
        flex: 1
        line-height: 20px
        overflow: hidden
        .name
          margin-bottom: 2px
          no-wrap()
          font-size: $font-size-medium
          color: $color-text
        .desc
          no-wrap()
          font-size: $font-size-small
          color: $color-text-d
      .control
        flex: 0 0 30px
        width: 30px
        padding: 0 10px
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size: 30px
          color: $color-theme-d
        .icon-mini
          font-size: 32px
          position: absolute
          left: 0
          top: 0

  @keyframes rotate
    0%
      transform: rotate(0)
    100%
      transform: rotate(360deg)
</style>
