// 洗牌函数
// 随机取[min,max]之间的整数
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// 打乱数组
export function shuffle(arr) {
  // 返回时，新数组，不会对老数组发生变化
  let _arr = arr.slice()
  for (let i = 0; i < _arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = _arr[i]
    _arr[i] = _arr[j]
    _arr[j] = t
  }
  return _arr
}

// 截留函数，函数延迟执行，不想那么快
export function debounce(func, delay) {
  let timer

  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}
