function addSVG(element, attr) {
  const svg = document.getElementById('svg')

  const path = document.createElementNS("http://www.w3.org/2000/svg", element)

  Object.keys(attr).forEach(key => {
    path.setAttribute(key, attr[key])
  })

  svg.appendChild(path)
}

function markCurve({ x, y, cx, cy, x2, y2, cx2, cy2 }) {
  const path = `M ${x} ${y}, C ${cx} ${cy}, ${cx2} ${cy2}, ${x2} ${y2}`

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

var stopTimeout;
var pushTimeout;

function smooth(a, x, y) {
  return 1 / (1 + Math.exp(-a * (x || 1) + (y || 1)))
}

class MouseMoveEvent {
  constructor(event, prev) {
    this.prev = prev || null

    this.t = Date.now()
    this.dt = this.prev ? this.t - this.prev.t : null
    this.dx = event.movementX
    this.dy = event.movementY
    this.x = event.clientX
    this.y = event.clientY
    // this.velX = this.dx / this.dt
    // this.velY = this.dy / this.dt
    this.dist = Math.sqrt((Math.abs(this.dx)^2) + (Math.abs(this.dy)^2))
    this.vel = this.dist / this.dt
    this.dir = Math.atan2(this.dx, this.dy)
  }

  getPrev(n = 1) {
    let prev = this, i = 1;

    while (prev.prev !== null) {
      prev = prev.prev
      if (i === n) { break } else { i++ }
    }

    return prev
  }

  getDelta(offset = 0, length = 1) {
    const end = offset > 0 ? this.getPrev(offset) : this
    const start = this.getPrev(offset + length)

    const dx = end.x - start.x
    const dy = end.y - start.y
    const dist = Math.sqrt((Math.abs(dx)^2) + (Math.abs(dy)^2))

    if (dist === 0) {
      console.log('========')
      console.log(dist)
      console.log(Math.abs(dx)^2, Math.abs(dy)^2)
    }

    return {
      t: start.t,
      endt: end.t,
      dt: end.t - start.t,
      dx: dx,
      dy: dy,
      dist: dist,
      vel: dist / (end.t - start.t),
      dir: Math.atan2(dy, dx)
    }
  }
}

class CurveEvent {
  constructor(events) {
    const startP = events[0],
      startP2 = events[1],
      endP = events[events.length - 1],
      endP2 = events[events.length - 2]

    this.start = {
      x: startP.x,
      y: startP.y,
      t: startP.t,
      dx: startP2.x - startP.x,
      dy: startP2.y - startP.y,
      dt: startP2.t - startP.t,
    }

    this.end = {
      x: endP.x,
      y: endP.y,
      t: endP.t,
      dx: endP.x - endP2.x,
      dy: endP.y - endP2.y,
      dt: endP.t - endP2.t,
    }
  }

  positionAt(time) {
    const prog = (time - this.start.t) / (this.end.t - this.start.t)
    const t = Math.max(Math.min(prog, 1), 0) // limit 0-1

    const points = this.bezierCurvePoints()
    const [x0, x1, x2, x3] = points.map(p => p.x)
    const [y0, y1, y2, y3] = points.map(p => p.y)

    const x = this._bezier(t, x0, x1, x2, x3),
          y = this._bezier(t, y0, y1, y2, y3)

    return { x, y }
  }

  bezierCurvePoints() {
    const factor = 3

    const { x, y, dx, dy } = this.start,
          cx = x + (dx * factor),
          cy = y + (dy * factor)

    const { x: x2, y: y2, dx: dx2, dy: dy2 } = this.end,
          cx2 = x2 - (dx2 * factor),
          cy2 = y2 - (dy2 * factor)

    return [
      { x, y },
      { x: cx, y: cy },
      { x: cx2, y: cy2 },
      { x: x2, y: y2}
    ]
  }

  _bezier(t, p0, p1, p2, p3) {
    return [
      Math.pow(1 - t, 3) * p0,
      3 * Math.pow(1 - t, 2) * t * p1,
      3 * (1 - t) * Math.pow(t, 2) * p2,
      Math.pow(t, 3) * p3,
    ].reduce((a, e) => (a + e), 0)
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

    if (this.events.length < 1) {
      markPoint(event, 'rgba(200, 0, 0, 1)', 10)
    } else {
      markPoint(event, 'rgba(100, 100, 100, 0.25)', 5)
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
    if (this.events.length < 1.2) { return }

    const events = this.events.slice()
    this.events = []

    const curve = this._buildCurve(events)

    const curveEvent = new CurveEvent(events)
    this.curves.push(curveEvent)

    markCurve(curve)
  }

  _buildCurve(events) {
    const gap = Math.max(Math.floor(events.length / 5), 1),
          factor = 2

    const startP = events[0],
          startP2 = events[gap],
          endP = events[events.length - 1],
          endP2 = events[events.length - gap - 1]

    const x = startP.x,
          y = startP.y,
          dx = startP2.x - x,
          dy = startP2.y - y,
          cx = x + (dx * factor),
          cy = y + (dy * factor)

    const x2 = endP.x,
          y2 = endP.y,
          dx2 = x2 - endP2.x,
          dy2 = y2 - endP2.y,
          cx2 = x2 - (dx2 * factor),
          cy2 = y2 - (dy2 * factor)

    return { x, y, cx, cy, x2, y2, cx2, cy2 }
  }
}
