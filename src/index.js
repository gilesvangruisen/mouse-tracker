
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
var vel = 0
var dir = null

var timeoutTime = 20;
var stopTimeout;

function onMouseMove(e) {
  stopTimeout && clearTimeout(stopTimeout)
  stopTimeout = setTimeout(function () {
    onMouseStop(e)
  }, timeoutTime)

  const now = Date.now()
  const lastPoint = points[points.length - 1]

  const timeDelta = lastPoint ? now - lastPoint.t : null

  const nextPoint = {
    dt: timeDelta,
    dx: e.movementX,
    dy: e.movementY,
    t: now,
    x: e.clientX,
    y: e.clientY
  }

  if (timeDelta > timeoutTime) { markPoint(nextPoint, 'green', 10) }

  const nextLastPoint = points[points.length - 10]


  points.push(nextPoint)
}

function onMouseStop(e) {
  const lastPoint = points[points.length - 1]
  const thirdLastPoint = points[points.length - 3]

  if (!lastPoint) return

  markPoint(lastPoint)

  if (!thirdLastPoint) return
  // lastPoint && console.log(lastPoint.dx, lastPoint.dy)
}

// function mouseTick() {
//   const point = points[points.length - 1]
//   point && console.log(point)
// }

// setInterval(mouseTick, 10)


window.onmousemove = onMouseMove