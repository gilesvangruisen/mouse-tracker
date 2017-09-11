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
          curveDuration = end.t - start.t,
          startControl = start.getNext(2),
          endControl = end.getPrev(2)

    const midPointIndex = sortedLastIndexBy(events, { t: start.t + (curveDuration / 2) }, e => e.t)

    const midLeft = events[midPointIndex]
    const midRight = events[midPointIndex + 1]

    const mid = {
      t: start.t + (curveDuration / 2),
      x: midLeft.x + ((midRight.x - midLeft.x) / 2),
      y: midLeft.y + ((midRight.y - midLeft.y) / 2),
    }

    markPoint(mid, 'blue', 20)

    console.log(events[midPointIndex])

    const startDelta = startControl.t - start.t
    const endDelta = end.t - endControl.t

    this.start = {
      x: start.x,
      y: start.y,
      t: start.t,
      vx: (startControl.x - start.x) / startDelta,
      vy: (startControl.y - start.y) / startDelta,
      dt: startControl.t - start.t,
    }

    this.end = {
      x: end.x,
      y: end.y,
      t: end.t,
      vx: (end.x - endControl.x) / endDelta,
      vy: (end.y - endControl.y) / endDelta,
      dt: end.t - endControl.t,
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

    const makeFactor = (dt, duration) => {
      const t = 1 - (Math.min(dt / duration, 0.5) * 2)
      const weight = 1 / (1 + Math.exp(-(t * 12) + 6))

      return (weight * (maxFactor - minFactor)) + minFactor
    }

    const startFactor = 2 //makeFactor(start.dt, curveDuration)
    const endFactor = 2 //makeFactor(end.dt, curveDuration)

    // console.log((start.dt / curveDuration), '==> ', startFactor)
    // console.log((end.dt / curveDuration), '==> ', endFactor)

    const factor = 1

    return [
      {
        x: start.x,
        y: start.y,
      },
      {
        x: start.x + (start.vx * start.dt),
        y: start.y + (start.vy * start.dt),
      },
      {
        x: end.x - (end.vx * end.dt),
        y: end.y - (end.vy * end.dt),
      },
      {
        x: end.x,
        y: end.y
      }
    ]
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

    // if (this._lastEvent &&
    //     this.events.length == 0 &&
    //     event.dt < this._defaultTimeout) {

    //   const firstEvent = new MouseMoveEvent(this._lastEvent.browserEvent, null)
    // firstEvent.first = true
    //   firstEvent.t = event.t

    //   firstEvent.next = event
    //   event.prev = firstEvent

    //   this.events.push(firstEvent)
    // }

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
