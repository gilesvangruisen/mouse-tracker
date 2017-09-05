
function markPoint(point, color = 'red', size = 20) {
  var c = document.createElement('div')
    c.style = `
    position: absolute;
    top: ${point.y - (size / 2)}px;
    left: ${point.x - (size / 2)}px;
    background: ${color};
    border-radius: ${size / 2}px;
    width: ${size}px;
    height: ${size}px;
    `

    document.querySelector('body').appendChild(c)
}


const points = []
const fixedPoints = []

var timeoutTime = 260;
var stopTimeout;

function onMouseMove(e) {
  const now = Date.now()

  let lastFixed = fixedPoints[fixedPoints.length - 1]
  var lastPoint = points[points.length - 10]

  if (lastFixed && lastPoint && lastFixed.t > lastPoint.t) {
    lastPoint = lastFixed
  }

  const timeDelta = lastPoint ? now - lastPoint.t : null

  let dy, dx, slope, rad, drad = null

  if (lastPoint) {
    dy = e.clientY - lastPoint.y
    dx = e.clientX - lastPoint.x
    slope = (dy / dx)
    rad = Math.atan2(dy, dx)
    drad = rad - lastPoint.rad
  }

  let fdx, fdy, frad, fdrad = null

  if (lastFixed) {
    fdy = e.clientY - lastFixed.y
    fdx = e.clientX - lastFixed.x
    frad = Math.atan2(fdy, fdx)
    fdrad = frad - lastFixed.frad
  }

  const nextPoint = {
    dt: timeDelta,
    dx: e.movementX,
    dy: e.movementY,
    t: now,
    x: e.clientX,
    y: e.clientY,
    rad: rad,
    drad: drad,
    frad: frad,
    fdrad: fdrad
  }

  if (!lastFixed) {
    markPoint(nextPoint, 'green', 10)
    markFixedPoint(nextPoint)
  } else if (timeDelta > timeoutTime) {
    markStart(nextPoint)
  } else if (Math.abs(drad) > 0.75 && lastPoint.t > lastFixed.t) {
    // markPoint(lastPoint, 'blue', 10)
    // markFixedPoint(lastPoint)
  }

  points.push(nextPoint)

  stopTimeout && clearTimeout(stopTimeout)
  stopTimeout = setTimeout(function () {
    onMouseStop(nextPoint)
  }, timeoutTime)
}

function _markStart(point) {
  markPoint(point, 'green', 10)
  markFixedPoint(point)
}

const markStart = throttle(_markStart, 9)

function onMouseStop(point) {
  markPoint(point, 'rgba(255,0,0,0.25)')
  markFixedPoint(point)
}

function markFixedPoint(point) {
  fixedPoints.push(point)

  markPoint(point, 'rgba(0,0,255,0.25)', 40)
}

function throttle(f, n) {
  var count = 0

  return function () {
    if (count === 0) {
      f.apply(this, arguments)
      count = n
    } else {
      count--
    }
  }
}

window.onmousemove = onMouseMove
