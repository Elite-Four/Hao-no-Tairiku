/* eslint-env browser */
/* global FCEUX */
void (function app () {
  var KEY_NAME_BIT = {
    'z': 1,
    'x': 2,
    'Space': 4,
    'Enter': 8,
    'ArrowUp': 16,
    'ArrowDown': 32,
    'ArrowLeft': 64,
    'ArrowRight': 128
  }
  var BUTTON_ID_BIT = {
    'button-a': 1,
    'button-b': 2,
    'button-select': 4,
    'button-start': 8,
    'button-up': 16,
    'button-down': 32,
    'button-left': 64,
    'button-right': 128
  }
  FCEUX().onRuntimeInitialized = function () {
    var fceux = this

    if (fceux.init('canvas') === false) {
      throw Error('Initialise FCEUX failed.')
    }

    fceux.addEventListener('game-loaded', function () {
      requestAnimationFrame(function frame () {
        fceux.update()
        requestAnimationFrame(frame)
      })

      var bits = 0
      function press (bit, down) {
        console.log(bit, down)
        if (down) {
          bits |= bit
        } else {
          bits &= ~bit
        }
        fceux.setControllerBits(bits)
      }

      document.addEventListener('keydown', function (event) {
        event.preventDefault()
        var bit = KEY_NAME_BIT[event.key]
        if (bit === undefined) return
        press(bit, true)
      }, true)
      document.addEventListener('keyup', function (event) {
        event.preventDefault()
        var bit = KEY_NAME_BIT[event.key]
        if (bit === undefined) return
        press(bit, false)
      }, true)

      ;[].forEach.call(document.querySelectorAll('button'), function (button) {
        console.log(button)
        button.addEventListener('mousedown', function (event) {
          var bit = BUTTON_ID_BIT[event.currentTarget.id]
          if (bit === undefined) return
          press(bit, true)
        })
        button.addEventListener('mouseup', function (event) {
          var bit = BUTTON_ID_BIT[event.currentTarget.id]
          if (bit === undefined) return
          press(bit, false)
        })
      })
    })
    fceux.downloadGame('rom.nes')
  }
}())
