import sortedLastIndexBy from 'lodash/sortedLastIndexBy';

function invariant(condition, msg) {
  if (!condition) { throw new Error(msg) }
}

function addSVG(element, attr) {
  const svg = document.getElementById('svg')

  const path = document.createElementNS("http://www.w3.org/2000/svg", element)

  Object.keys(attr).forEach(key => {
    path.setAttribute(key, attr[key])
  })

  svg.appendChild(path)
}

function markCurve(points) {
  const [p0, p1, p2, p3] = points
  const path = `M ${p0.x} ${p0.y}, C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`

  markPoint(p0, 'red', 4)
  markPoint(p1, 'green', 4)
  markPoint(p2, 'green', 4)
  markPoint(p3, 'red', 4)

  addSVG('path', {
    d: path,
    stroke: 'rgba(0, 0, 200, 0.5)',
    'stroke-width': 2,
    fill: 'transparent'
  })
}

function markPoint(point, color = 'red', size = 20) {
  const halfSize = size / 2

  addSVG('circle', {
    cx: point.x,
    cy: point.y,
    r: halfSize,
    fill: color
  })
}

class MouseMoveEvent {
  constructor(event, prev) {
    this.browserEvent = event

    this.prev = prev || null;
    if (this.prev) { this.prev.next = this }

    this.t = Date.now()
    this.dt = this.prev ? this.t - this.prev.t : null
    this.dx = event.movementX
    this.dy = event.movementY
    this.x = event.clientX
    this.y = event.clientY
  }

  getPrev(n = 1) {
    let prev = this, i = 1;

    while (prev.prev !== null) {
      prev = prev.prev
      if (i === n) { break } else { i++ }
    }

    return prev
  }

  getNext(n = 1) {
    let next = this, i = 1;

    while (next.next !== null) {
      next = next.next
      if (i === n) { break } else { i++ }
    }

    return next
  }
}

class CurveEvent {
  constructor(events) {
    const start = events[0],
          end = events[events.length - 1],
          curveDuration = end.t - start.t

    this.start = {
      x: start.x,
      y: start.y,
      t: start.t,
      m: start.dy / start.dx,
    }

    const midPointIndex = Math.floor((events.length - 1) / 2)//sortedLastIndexBy(events, { t: start.t + (curveDuration / 2) }, e => e.t)
    const midLeft = events[midPointIndex]
    const midRight = events[midPointIndex + 1]

    this.mid = {
      t: midLeft.t + ((midRight.t - midLeft.t) / 2),
      x: midLeft.x + ((midRight.x - midLeft.x) / 2),
      y: midLeft.y + ((midRight.y - midLeft.y) / 2),
      m: (midRight.y - midLeft.y) / (midRight.x - midLeft.x) || 0,
    }

    this.end = {
      x: end.x,
      y: end.y,
      t: end.t,
      m: end.dy / end.dx,
    }
  }

  positionAt(time) {
    const prog = (time - this.start.t) / (this.end.t - this.start.t)
    const t = Math.max(Math.min(prog, 1), 0)

    const points = this.bezierCurvePoints(),
          [x0, x1, x2, x3] = points.map(p => p.x),
          [y0, y1, y2, y3] = points.map(p => p.y)

    const x = this._bezier(t, x0, x1, x2, x3),
          y = this._bezier(t, y0, y1, y2, y3)

    return { x, y }
  }

  bezierCurvePoints() {
    const { start, end } = this
    const curveDuration = end.t - start.t

    const minFactor = 1
    const maxFactor = 2

    const baselineVector = {
      x: end.x - start.x,
      y: end.y - start.y,
    }

    const baselineLength = Math.sqrt(Math.pow(baselineVector.x, 2) + Math.pow(baselineVector.y, 2))

    const abc = (b, t) => {
      const u = Math.pow(1 - t, 3) / (Math.pow(t, 3) + Math.pow(1 - t, 3))
      const _u = 1 - u

      const rPart = Math.pow(t, 3) + Math.pow(1 - t, 3)
      const r = Math.abs((rPart - 1) / rPart)

      const c = {
        x: start.x + (_u * baselineVector.x),
        y: start.y + (_u * baselineVector.y),
      }

      const a = {
        x: b.x + ((b.x - c.x) / r),
        y: b.y + ((b.y - c.y) / r),
      }

      return { a, b, c }
    }


    const t = 0.5
    const tension = 0.4

    const deVector = {
      x: baselineVector.x * tension,
      y: baselineVector.y * tension
    }

    const { a, b, c } = abc(this.mid, t)

    // markPoint(a, 'red', 10)
    // markPoint(b, 'green', 10)
    // markPoint(c, 'blue', 10)

    // const deRun = deLen / Math.sqrt(Math.pow(this.mid.m, 2) + 1)
    // var deRise = deRun === 0 ? deLen : deRun * this.mid.m

    const d = {
      x: b.x - (deVector.x / 2),
      y: b.y - (deVector.y / 2)
    }

    const e = {
      x: b.x + (deVector.x / 2),
      y: b.y + (deVector.y / 2)
    }

    markPoint(d, 'blue', 8)
    markPoint(e, 'green', 8)
    // console.log('-------')
    // console.log(deLen)
    // console.log(Math.sqrt(Math.pow(e.x - d.x, 2) + Math.pow(e.y - b.y, 2)))

    const daLen = { x: a.x - d.x, y: a.y - d.y }
    const eaLen = { x: a.x - e.x, y: a.y - e.y }

    // prog pt P0 - P1
    const h = {
      x: d.x - (daLen.x / (1 - t)) * t,
      y: d.y - (daLen.y / (1 - t)) * t,
    }

    // prog pt P3 - P2
    const k = {
      x: e.x - (eaLen.x / t) * (1 - t),
      y: e.y - (eaLen.y / t) * (1 - t),
    }

    const p1 = {
      x: h.x + ((h.x - start.x) / (1 - t)) * t,
      y: h.y + ((h.y - start.y) / (1 - t)) * t,
    }

    const p2 = {
      x: k.x + ((k.x - end.x) / t) * (1 - t),
      y: k.y + ((k.y - end.y) / t) * (1 - t),
    }


    const points = [
      {
        x: start.x,
        y: start.y,
      },
      p1,
      p2,
      {
        x: end.x,
        y: end.y
      }
    ]

    return points
  }

  _bezier(t, p0, p1, p2, p3) {
    return Math.pow(1 - t, 3) * p0
         + 3 * Math.pow(1 - t, 2) * t * p1
         + 3 * (1 - t) * Math.pow(t, 2) * p2
         + Math.pow(t, 3) * p3
  }
}

export default class MouseRecorder {
  constructor() {
    this._defaultTimeout = 50
    this._finishTimeout = null;
    this._lastEvent = null;

    this.curves = []
    this.events = []

    this.startRecording = this.startRecording.bind(this)
    this.add = this.add.bind(this)
  }

  startRecording() {
    window.onmousemove = this.add
  }

  stopRecording() {
    window.onmousemove = () => {}
    this.finish()
  }

  shouldFinish(event) {
    if (this.events.length < 2) {
      return false
    }

    if (event.dt > this._defaultTimeout) {
      return true
    }

    if (event.t - this.events[0].t > 160) {
      return true
    }

    return false
  }

  add(browserEvent) {
    this._finishTimeout && clearTimeout(this._finishTimeout)

    const event = new MouseMoveEvent(browserEvent, this._lastEvent)
    markPoint(event, 'rgba(100,100,100,0.25)', 5)

    if (this._lastEvent &&
        this.events.length == 0 &&
        event.dt < this._defaultTimeout) {

      const firstEvent = new MouseMoveEvent(this._lastEvent.browserEvent, null)
    firstEvent.first = true

    if (event.t - firstEvent.t > this._defaultTimeout) {
      firstEvent.t = event.t
      }

      firstEvent.next = event
      event.prev = firstEvent

      this.events.push(firstEvent)
    }

    this.events.push(event)
    this._lastEvent = event

    if (this.shouldFinish(event)) {
      this.finish()
    } else {
      this._finishTimeout = setTimeout(this.finish.bind(this), this._defaultTimeout)
    }
  }

  finish() {
    const eventCount = this.events.length

    if (eventCount < 2) { return }

    const events = this.events.slice()
    this.events = []

    const curveEvent = new CurveEvent(events)
    this.curves.push(curveEvent)

    markCurve(curveEvent.bezierCurvePoints())
  }
}
