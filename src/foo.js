

  if (nextLastPoint) {
    // console.log((nextPoint.dx ^ 2) + (nextPoint.dy ^ 2), Math.sqrt((nextPoint.dx ^ 2) + (nextPoint.dy ^ 2)))
    const dx = nextPoint.x - nextLastPoint.x,
          dy = nextPoint.y - nextLastPoint.y

    const nextVel = Math.sqrt((Math.abs(dx) ^ 2) + (Math.abs(dy) ^ 2))
// console.log(dx, dy, Math.sign(dy))

    const tanIn = dy / dx // || ((Math.sign(-dy) * 100000) / dx) || 100000 / dx
    const nextDir = (Math.atan(tanIn) * 180) / Math.PI

    console.log(tanIn)
    // console.log(dx, -dy, nextDir)

    vel = nextVel
    dir = nextDir
  }