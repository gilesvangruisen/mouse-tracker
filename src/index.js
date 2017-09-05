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
    stroke: 'blue',
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

const points = []
const curves = []

var timeoutTime = 30;
var stopTimeout;
var pushTimeout;

function onMouseMove(onStart, onSample, onStop) {
  return function (e) {
    const now = Date.now()
    const lastPoint = points[points.length - 1]
    const timeDelta = lastPoint ? now - lastPoint.t : null

    const nextPoint = {
      dt: timeDelta,
      dx: e.movementX,
      dy: e.movementY,
      t: now,
      x: e.clientX,
      y: e.clientY,
      vx: e.movementX / timeDelta,
      vy: e.movementY / timeDelta,
    }

    points.push(nextPoint)

    if (!lastPoint || timeDelta > timeoutTime) {
      onStart(nextPoint)
    }

    let ax = (nextPoint.vx - lastPoint.vx) / timeDelta,
        ay = (nextPoint.vy - lastPoint.vy) / timeDelta


    console.log(ax, ay)

    onSample(nextPoint)

    stopTimeout && clearTimeout(stopTimeout)
    stopTimeout = setTimeout(() => {
      pushTimeout && clearTimeout(pushTimeout)
      onStop(nextPoint)
    }, timeoutTime)
  }
}

function markFixedPoint(point) {
  fixedPoints.push(point)

  markPoint(point, 'rgba(0,0,255,0.25)', 40)
}

class MouseProcessor {
  constructor() {
    this.curves = []
    this.samples = []
  }

  add(p) {
    this.samples.push(p)
  }

  finish() {
    if (this.samples.length < 2) { return }

    const points = this.samples.slice()
    this.samples = []

    const curve = this._buildCurve(points)
    this.curves.push(curve)

    markCurve(curve)
  }

  _buildCurve(points) {
    const gap = 1 // Math.floor(points.length / 5)
    const factor = 1

    const startP = points[0],
          startP2 = points[gap],
          endP = points[points.length - 1],
          endP2 = points[points.length - gap - 1]

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

const processor = new MouseProcessor()

function onStart(p) {
  markPoint(p, 'rgba(0,200,0,0.25)', 40)
}

function onSample(p) {
  markPoint(p, 'rgba(100,100,100,0.25', 5)
  processor.add(p)
}

function onStop(p) {
  markPoint(p, 'rgba(200,0,0,0.25)', 20)

  processor.finish()
}





window.onmousemove = onMouseMove(onStart, onSample, onStop)
