import Vue from 'vue'
import Router from 'vue-router'
// 同步加载
// import Recommend from 'components/recommend/recommend'
// // 歌单详情
// import Disc from 'components/disc/disc'
// import Singer from 'components/singer/singer'
// import SingerDetail from 'components/singer-detail/singer-detail'
// import Rank from 'components/rank/rank'
// import TopList from 'components/top-list/top-list'
// import Search from 'components/search/search'
// import UserCenter from 'components/user-center/user-center'

Vue.use(Router)
// 路由懒加载，异步加载
const Recommend = (resolve) => {
  import('components/recommend/recommend').then((module) => {
    resolve(module)
  })
}

const Singer = (resolve) => {
  import('components/singer/singer').then((module) => {
    resolve(module)
  })
}

const Rank = (resolve) => {
  import('components/rank/rank').then((module) => {
    resolve(module)
  })
}

const Search = (resolve) => {
  import('components/search/search').then((module) => {
    resolve(module)
  })
}

const SingerDetail = (resolve) => {
  import('components/singer-detail/singer-detail').then((module) => {
    resolve(module)
  })
}

const Disc = (resolve) => {
  import('components/disc/disc').then((module) => {
    resolve(module)
  })
}

const TopList = (resolve) => {
  import('components/top-list/top-list').then((module) => {
    resolve(module)
  })
}

const UserCenter = (resolve) => {
  import('components/user-center/user-center').then((module) => {
    resolve(module)
  })
}

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/recommend'
    },
    {
      path: '/recommend',
      // 冒号后面有空格，严格要求
      component: Recommend,
      children: [
        {
          // 变量可以改变路由
          path: ':id',
          component: Disc
        }]
    },
    {
      path: '/singer',
      component: Singer,
      children: [
        {
          // 变量可以改变路由
          path: ':id',
          component: SingerDetail
        }]
    },
    {
      path: '/rank',
      component: Rank,
      children: [
        {
          // 变量可以改变路由
          path: ':id',
          component: TopList
        }]
    },
    {
      path: '/search',
      component: Search,
      children: [
        {
          // 变量可以改变路由
          path: ':id',
          component: SingerDetail
        }]
    },
    {
      path: '/user',
      component: UserCenter
    }
  ]
})
