import MouseRecorder from './recorder'
import MousePlayer from './player'

window.recorder = new MouseRecorder()
window.player = new MousePlayer()

var i = 10;

const countdown = setInterval(() => {
  i--
  document.querySelector('h1').innerHTML = i
  if (i === 0) {
    // clearInterval(countdown)

    window.recorder.stopRecording()
    window.player.setCurves(window.recorder.curves)

    window.player.attach()
  }
}, 1000)

window.recorder.startRecording()

