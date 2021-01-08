/* eslint-env browser */
/* global FCEUX */
void (function app() {
  var url = new URL(location.href)
  var token = url.searchParams.get('token')
  var gist = url.searchParams.get('gist')

  function cors(url) {
    return 'https://test.cors.workers.dev/?' + encodeURIComponent(url)
  }

  if (!token) {
    token = prompt('GitHub Personal Access Token:')
    if (token) {
      url.searchParams.set('token', token)
      history.replaceState(null, document.title, url.toString())
    }
  }
  if (token) {
    if (gist) {
      fetch(cors('https://api.github.com/gists/' + encodeURIComponent(gist)), {
        headers: {
          Authorization: 'token ' + token
        }
      })
        .then(function (response) {
          if (!response.ok) {
            throw Error('HTTP ' + response.status)
          }
          return response.json()
        })
        .then(function (data) {
          var files = data.files
          var saveFiles = {}
          for (var filename in files) {
            if ({}.hasOwnProperty.call(files, filename)) {
              saveFiles[filename] = Uint8Array.from(JSON.parse(files[filename].content))
            }
          }
          start(saveFiles)
        })
    } else {
      alert('No gist id provided.\nWill create a new gist.')
      start()
    }
  } else {
    alert('No token Provided, will not enable online save.')
    start()
  }

  function save(saveFiles) {
    if (!token) return
    document.querySelector('[data-key="s"]').classList.add('is-loading')
    var apiUrl = 'https://api.github.com/gists'
    if (gist) {
      apiUrl += '/' + encodeURIComponent(gist)
    }
    var files = {}
    for (var filename in saveFiles) {
      if ({}.hasOwnProperty.call(saveFiles, filename)) {
        files[filename] = { content: JSON.stringify([].slice.call(saveFiles[filename])) }
      }
    }
    fetch(cors(apiUrl), {
      method: gist ? 'PATCH' : 'POST',
      headers: {
        Authorization: 'token ' + token
      },
      body: JSON.stringify({
        description: 'Save files of 三国志II 覇王の大陸',
        files: files
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw Error('HTTP ' + response.status)
        }
        return response.json()
      })
      .then(function (data) {
        console.log('Saved to GitHub Gist')
        document.querySelector('[data-key="s"]').classList.remove('is-loading')
        if (!gist) {
          gist = data.id
          url.searchParams.set('gist', gist)
          history.replaceState(null, document.title, url.toString())
          prompt('Your save state url is', url)
        }
      })
  }

  function start(saveFiles) {
    var KEY_NAME_BIT = {
      z: 1,
      x: 2,
      Space: 4,
      Enter: 8,
      ArrowUp: 16,
      ArrowDown: 32,
      ArrowLeft: 64,
      ArrowRight: 128
    }
    FCEUX().then(function (fceux) {
      if (fceux.init('canvas') === false) {
        throw Error('Initialise FCEUX failed.')
      }

      fceux.addEventListener('game-loaded', function () {
        if (saveFiles) {
          console.log('Loaded', saveFiles)
          fceux.importSaveFiles(saveFiles)
          fceux.loadState()
        }
        requestAnimationFrame(function frame() {
          fceux.update()
          requestAnimationFrame(frame)
        })

        var bits = 0
        function press(keyName, down) {
          var bit = KEY_NAME_BIT[keyName]
          if (bit !== undefined) {
            console.log(bit, down)

            if (down) {
              bits |= bit
            } else {
              bits &= ~bit
            }

            fceux.setControllerBits(bits)
            return true
          }
          if (keyName === 's' && down === false) {
            fceux.saveState()
            save('Saved', fceux.exportSaveFiles())
            return true
          }
          if (keyName === 'l' && down === false) {
            fceux.loadState()
            return true
          }
          return false
        }

        document.addEventListener(
          'keydown',
          function (event) {
            if (press(event.key, true)) event.preventDefault()
          },
          true
        )
        document.addEventListener(
          'keyup',
          function (event) {
            if (press(event.key, false)) event.preventDefault()
          },
          true
        )
        ;[].forEach.call(document.querySelectorAll('[data-key]'), function (button) {
          function handleDown(event) {
            if (press(event.currentTarget.dataset.key, true)) event.preventDefault()
          }
          function handleUp(event) {
            if (press(event.currentTarget.dataset.key, false)) event.preventDefault()
          }
          button.addEventListener('mousedown', handleDown)
          button.addEventListener('touchstart', handleDown)
          button.addEventListener('mouseup', handleUp)
          button.addEventListener('touchend', handleUp)
        })
      })
      fceux.downloadGame('rom.nes')
    })
  }
})()
