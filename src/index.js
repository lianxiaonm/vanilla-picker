import './style.less'

const { platform, userAgent } = navigator
const isIOS = /(iphone|ipad|ipod)/i.test(userAgent) && /(iphone|ipad|ipod)/i.test(platform)

const MAX_EXCEED = 10
const VISIBLE_RANGE = 90
const DEFAULT_ITEM_HEIGHT = 40

function rad2deg(rad) {
  return rad / (Math.PI / 180)
}

function assign(target, source, override = true) {
  Object.keys(source).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(target, key) && !override) {
      const message = `${key}: ${target[key]}, but try to replace by ${source[key]}`
      throw new Error(message)
    }
    target[key] = source[key] // eslint-disable-line no-param-reassign
  })
  return target
}

function isEmpty(x) {
  return [null, undefined].indexOf(x) !== -1
}

function quartEaseOut(t, b, c, d) {
  // eslint-disable-next-line
  return -c * ((t = t / d - 1) * t * t * t - 1) + b
}

export default class Picker {
  constructor(holder) {
    assign(this, { holder, stopInertiaMove: 0, lastMoveStart: 0, lastMoveTime: 0 })
    this.init()
    this.calcElItemPosition()
    this.$toggleEvent()
  }

  findElItems() {
    this.elItems = [].slice.call(this.holder.querySelectorAll('li'))
    return this
  }

  calcAngle(c1) {
    // 只算角度不关心正否值
    let c = Math.abs(c1)
    const a = parseFloat(this.r)
    const intDeg = parseInt(c / this.d, 10) * 180
    c %= this.d
    const cosC = 1 - ((c * c) / (2 * a * a))
    return intDeg + rad2deg(Math.acos(cosC))
  }

  init() {
    const { holder, elItems } = this.findElItems()
    const { offsetHeight } = holder
    const list = holder.querySelector('ul')

    // 单列高度
    const itemHeight = elItems.length ? elItems[0].offsetHeight : DEFAULT_ITEM_HEIGHT

    assign(list, { angle: 0 })

    assign(this, {
      list,
      height: offsetHeight,
      d: offsetHeight,
      r: offsetHeight / 2,
      itemHeight,
      visibleRange: VISIBLE_RANGE,
      beginAngle: 0,
      beginExceed: -MAX_EXCEED,
    })

    const itemAngle = parseInt(this.calcAngle(itemHeight * 0.8), 10)

    assign(this, { itemAngle, hightlightRange: itemAngle / 2 })

    if (isIOS) list.style.webkitTransformOrigin = `center center ${this.r}px`

    this.bindEvent()
  }

  bindEvent() {
    let lastAngle = 0
    let startY = null
    let isPicking = false
    const { list } = this

    const touchstart = (event) => {
      event.stopPropagation()
      event.preventDefault()
      isPicking = true
      list.style.webkitTransition = ''
      startY = (event.changedTouches ? event.changedTouches[0] : event).pageY
      lastAngle = list.angle
      this.updateParams(event, true)
    }
    const touchend = (event) => {
      event.stopPropagation()
      isPicking = false
      this.startScroll(event)
    }

    const touchmove = (event) => {
      if (!isPicking) return
      event.stopPropagation()
      const endY = (event.changedTouches ? event.changedTouches[0] : event).pageY
      const dragRange = (endY - startY) / 1.3
      const dragAngle = this.calcAngle(dragRange)
      let newAngle = dragRange > 0 ? lastAngle - dragAngle : lastAngle + dragAngle
      newAngle = Math.max(Math.min(newAngle, this.endExceed), this.beginExceed)
      this.setAngle(newAngle)
      this.updateParams(event)
    }
    assign(this, {
      // 自定义事件
      _events: { },
      events: { touchstart, touchmove, touchcancel: touchend, touchend },
    })
  }

  reLayout(index) {
    this.findElItems()
    this.calcElItemPosition()
    if (isEmpty(index)) this.endScroll()
    else this.setIdx(index)
  }

  calcElItemPosition() {
    const { elItems, itemAngle, r } = this
    let { endAngle } = this
    elItems.forEach((item, idx) => {
      endAngle = itemAngle * idx
      assign(item, { angle: endAngle })
      item.style.webkitTransformOrigin = `center center -${r}px`
      item.style.webkitTransform = `translateZ(${r}px) rotateX(${-endAngle}deg)`
    })
    assign(this, { endAngle, endExceed: endAngle + MAX_EXCEED })
    this.calcElItemVisibility(this.beginAngle)
  }

  calcElItemVisibility(angle) {
    const { hightlightRange, elItems, visibleRange } = this
    elItems.forEach(item => {
      const diff = Math.abs(item.angle - angle)
      if (diff < hightlightRange) {
        item.classList.add('highlight')
      } else if (diff < visibleRange) {
        item.classList.add('visible')
        item.classList.remove('highlight')
      } else {
        item.classList.remove('highlight')
        item.classList.remove('visible')
      }
    })
  }

  setAngle(angle) {
    this.list.angle = angle
    this.list.style.webkitTransform = `perspective(1000px) rotateY(0) rotateX(${angle}deg)`
    this.calcElItemVisibility(angle)
  }

  updateParams(event, isStart) {
    const { pageY, nowTime } = this.analyzeEvent(event)
    const merge = { stopInertiaMove: true }
    const baseMerge = { lastMoveStart: pageY, lastMoveTime: nowTime }
    if (isStart) {
      assign(baseMerge, { startAngle: this.list.angle })
      assign(merge, baseMerge)
    } else if (nowTime - this.lastMoveTime > 300) {
      assign(merge, baseMerge)
    }
    assign(this, merge)
  }

  $toggleEvent(remove) {
    const eventType = remove ? 'removeEventListener' : 'addEventListener'
    const { holder, events } = this
    Object.keys(events).forEach(evName => {
      holder[eventType](evName, events[evName], false)
    })
  }

  toggleEvent(type, fn, remove) {
    const { _events } = this
    if (isEmpty(_events[type])) _events[type] = []

    const evList = _events[type]
    if (remove) {
      const index = evList.indexOf(fn)
      if (index > -1) evList.splice(index, 1)
    } else evList.push(fn)
  }

  $execEvent(type) {
    const { _events } = this
    const args = [].slice.call(arguments, 1)
    const evList = _events[type] || []
    evList.forEach((_ev) => {
      if (typeof _ev === 'function') {
        _ev.apply(this, args)
      }
    })
  }

  analyzeEvent(event) {
    const point = event.changedTouches ? event.changedTouches[0] : event
    const nowTime = event.timeStamp || Date.now()
    return { pageY: point.pageY, nowTime }
  }

  startScroll(event) {
    const { beginExceed, endExceed } = this
    const { pageY, nowTime } = this.analyzeEvent(event)
    const { lastMoveStart, lastMoveTime, list } = this
    const v = (pageY - lastMoveStart) / (nowTime - lastMoveTime) // 最后一段时间手指划动速度
    const dir = v > 0 ? -1 : 1 // 加速度方向

    let duration = Math.abs(v / (dir * 0.001)) // 速度消减至0所需时间

    const dist = (v * duration) / 6 // 最终移动多少
    const { angle: startAngle } = list
    const srcDistAngle = this.calcAngle(dist) * dir

    let distAngle = srcDistAngle

    if (startAngle + distAngle < beginExceed) {
      distAngle = beginExceed - startAngle
      duration = duration * (distAngle / srcDistAngle) * 0.6
    }

    if (startAngle + distAngle > endExceed) {
      distAngle = endExceed - startAngle
      duration = duration * (distAngle / srcDistAngle) * 0.6
    }

    if (distAngle) {
      const { length: angleLen } = this.elItems
      const nearAngle = parseInt((startAngle + distAngle) / this.itemAngle, 10)
      // eslint-disable-next-line
      const nearDist = this.itemAngle * (nearAngle > angleLen ? angleLen : nearAngle < 0 ? 0 : nearAngle)
      this.scrollDistAngle(nowTime, startAngle, nearDist - startAngle, duration)
    } else this.endScroll()
  }

  scrollDistAngle(nowTime, startAngle, distAngle, duration) {
    const self = this
    const frameInterval = 1000 / 60
    const stepCount = duration / frameInterval
    let stepIndex = 0
    self.stopInertiaMove = false
    ;(function inertiaMove() {
      if (self.stopInertiaMove) return
      const newAngle = quartEaseOut(stepIndex, startAngle, distAngle, stepCount)
      self.setAngle(newAngle)
      stepIndex += 1
      if (stepIndex > stepCount - 1
        || newAngle < self.beginExceed
        || newAngle > self.endExceed) self.endScroll()
      else requestAnimationFrame(inertiaMove)
    }())
  }

  endScroll(noAni) {
    const { angle } = this.list
    const $angle = this.correctAngle(angle)
    // eslint-disable-next-line
    this.list.style.webkitTransition = `${angle === $angle ? noAni ? 0 : 150 : 300}ms linear`
    this.setAngle(angle === $angle ? this.itemAngle * this.getIdx() : $angle)

    this.$execEvent('change')
  }

  correctAngle(angle) {
    if (angle < this.beginAngle) return this.beginAngle
    if (angle > this.endAngle) return this.endAngle
    return angle
  }

  getIdx() {
    return parseInt((this.list.angle / this.itemAngle).toFixed(0), 10)
  }

  setIdx(index) {
    this.list.angle = this.itemAngle * index
    this.endScroll(true)
  }

  destroy() {
    this.$toggleEvent(true)
    this.$events = {}
  }
}
