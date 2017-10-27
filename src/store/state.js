import { playMode } from 'common/js/config'
import { loadSearch, loadPlay, loadFavorite } from 'common/js/cache'

const state = {
  singer: {},
  // 播放器
  // 是否播放
  playing: false,
  // 是否全屏播放
  fullScreen: false,
  // 播放列表
  playlist: [],
  // 播放顺序
  sequenceList: [],
  // 播放模式
  mode: playMode.sequence,
  // 当前播放的索引
  currentIndex: -1,
  // 歌单详情
  disc: {},
  // 排行榜
  topList: {},
  // 从本地缓存获取数据加载初始值
  searchHistory: loadSearch(),
//  播放历史
  playHistory: loadPlay(),
//  我喜欢的收藏
  favoriteList: loadFavorite()

}
export default state
