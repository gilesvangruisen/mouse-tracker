

export default class MousePlayer {
  constructor() {
    this.curves = null
  }

  setCurves(curves) {
    this.curves = curves

    this.startTime = this.curves[0].start.t
    this.endTime = this.curves[this.curves.length - 1].end.t
  }

  attach() {
    if (!this.curves || !this.curves.length) { return }

    const slider = document.createElement('input')

    slider.setAttribute('type', 'range')
    slider.setAttribute('min', 0)
    slider.setAttribute('max', 100)
    slider.setAttribute('id', 'slider')
    slider.setAttribute('value', 0)

    slider.oninput = this.onChange.bind(this)

    document.querySelector('body').appendChild(slider)
  }

  onChange(e) {
    const i = parseInt(e.target.value)
    const itDelta = (i / 100) * (this.endTime - this.startTime)
    const it = Math.round(this.startTime + itDelta)

    const pos = this.cursorPosition(it)

    const curs = document.getElementById('cursor')
    curs.setAttribute('cx', pos.x)
    curs.setAttribute('cy', pos.y)
  }

  cursorPosition(t) {
    const curveIndex = this.findCurve(t),
          curve = this.curves[curveIndex]

    return curve.positionAt(t)
  }

  findCurve(target) {
    var set = this.curves
    var minIndex = 0
    var maxIndex = set.length - 1
    var currentIndex
    var currentElement
    var nextElement

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0

      currentElement = set[currentIndex]
      nextElement = set[currentIndex + 1]

      if (nextElement && target >= nextElement.start.t) {
        minIndex = currentIndex + 1
      } else if (target < currentElement.start.t) {
        maxIndex = currentIndex - 1
      } else {
        return currentIndex
      }
    }

    return -1
  }
}