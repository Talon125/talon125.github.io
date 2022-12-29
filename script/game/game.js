import { loadGameType } from "../loaders.js"
import {
  PIECE_COLORS,
  NEXT_OFFSETS,
  SCORE_TABLES,
  SKIN_SETS,
  SOUND_SETS,
  PIECE_SETS,
} from "../consts.js"
import menu from "../menu/menu.js"
import Stack from "./stack.js"
import Piece from "./piece.js"
import $, { toCtx, msToTime } from "../shortcuts.js"
import { loops } from "./loops.js"
import gameHandler from "./game-handler.js"
import Next from "./next.js"
import settings from "../settings.js"
import input from "../input.js"
import Hold from "./hold.js"
import sound from "../sound.js"
import Particle from "./particle.js"
import locale from "../lang.js"
let endScreenTimeout = null
export default class Game {
  constructor(gametype) {
    if (gametype === "beat") {
      document.getElementById("myVideo").style.opacity = 1
    } else {
      document.getElementById("myVideo").style.opacity = 0
    }
    this.userSettings = { ...settings.settings }
    this.type = gametype
    this.pieceCanvas = $("#piece")
    this.nextMatrixPreviewCanvas = $("#next-piece")
    this.stackCanvas = $("#stack")
    this.nextCanvas = $("#next-main")
    this.nextSubCanvas = $("#next-sub")
    this.holdCanvas = $("#hold")
    this.particleCanvas = $("#particle")
    this.bufferPeek = 0.25
    this.loop
    this.now
    this.deltaTime
    this.last = this.timestamp()
    this.stats = []
    this.request
    this.loadFinished = false
    this.noUpdate = false
    this.isOver = false
    this.isDead = false
    this.isPaused = false
    this.isDirty = true
    this.isVisible = false
    this.musicLinePointCleared = []
    this.onPaceTime = 0
    this.startedOnPaceEvent = false
    this.background = ""
    this.stat = {
      b2b: 0,
      pcCount: 0,
      skipCount: 0,
      level: 0,
      score: 0,
      line: 0,
      piece: 0,
      maxcombo: 0,
    }
    this.appends = {}
    this.prefixes = {}
    this.smallStats = {
      b2b: true,
      skipCount: true,
      score: true,
      piece: true,
      fallspeed: true,
      entrydelay: true,
      pace: true,
    }
    this.endingStats = {
      pcCount: true,
      skipCount: true,
      score: true,
      level: true,
      piece: true,
      line: true,
      maxcombo: true,
    }
    this.b2b = 0
    this.maxb2b = 0
    this.combo = -1
    this.matrix = {
      position: {
        x: 0,
        y: 0,
      },
      velocity: {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
      },
      shakeVelocity: {
        x: 0,
        y: 0,
      },
    }
    this.startingTime = 0
    this.timePassed = 0
    this.timePassedAre = 0
    loadGameType(gametype)
      .then((gameData) => {
        gtag("event", "play", {
          event_category: "Game",
          event_label: gametype,
        })
        this.show()
        menu.close()
        this.startingTime = this.timestamp()
        clearTimeout(endScreenTimeout)
        $("#combo-counter-container").classList.add("hidden")
        $("#garbage-counter").textContent = ""
        $("#timer").classList.remove("pace")
        $("#timer-real").classList.remove("pace")
        $("#timer").classList.remove("hurry-up")
        $("#timer-real").classList.remove("hurry-up")
        $("#game").classList.remove("dead")
        $("#ready-meter").classList.remove("hidden")
        $("#end-message-container").classList.add("hidden")
        $("#kill-message-container").classList.add("hidden")
        $("#next-piece").classList.remove("immediate-death")

        this.resetBeatStuff()

        if (this.type === "nontwo") {
          $("#lights-warning").classList.remove("hidden")
        } else {
          $("#lights-warning").classList.add("hidden")
        }

        for (const element of document.querySelectorAll(".action-text")) {
          element.parentNode.removeChild(element)
        }
        this.settings = gameData.settings
        this.stats = gameData.stats
        // SET UP MODULES
        this.stack = new Stack(this, toCtx(this.stackCanvas))
        this.piece = new Piece(
          this,
          toCtx(this.pieceCanvas),
          toCtx(this.nextMatrixPreviewCanvas)
        )
        let randomseed = new Math.seedrandom()()
        if ($("#queuerand").value !== "") {
          randomseed = $("#queuerand").value
        }
        this.next = new Next(
          this,
          toCtx(this.nextCanvas),
          toCtx(this.nextSubCanvas),
          randomseed
        )
        this.hold = new Hold(this, toCtx(this.holdCanvas))
        this.particle = new Particle(this, toCtx(this.particleCanvas))
        this.stack.endAlarm()
        // SET UP SETTINGS

        if (this.userSettings.rotationSystem === "auto") {
          this.rotationSystem = this.settings.rotationSystem
        } else {
          this.settings.rotationSystem = this.userSettings.rotationSystem
          this.rotationSystem = this.userSettings.rotationSystem
        }

        if (this.userSettings.spinDetectionType != "auto") {
          this.settings.spinDetectionType = this.userSettings.spinDetectionType
          this.spinDetectionType = this.userSettings.spinDetectionType
        }

        if (!this.settings.disableDefaultSkinLoad) {
          this.makeSprite()
        }
        const soundbankName =
          settings.settings.soundbank === "auto"
            ? SOUND_SETS[this.settings.rotationSystem]
            : settings.settings.soundbank
        sound.load(soundbankName)
        this.colors = JSON.parse(
          JSON.stringify(PIECE_COLORS[this.settings.rotationSystem])
        )
        for (const pieceName of PIECE_SETS[this.settings.pieces]) {
          const color = settings.settings[`color${pieceName}`]
          if (color === "auto") {
            continue
          }
          this.colors[pieceName] = color
        }

        switch (settings.settings.shapeOverride) {
          case "mono":
            this.nextOffsets = NEXT_OFFSETS["monomino"]
            break
          // case 'pento':
          //   this.nextOffsets = NEXT_OFFSETS['pentomino'];
          //   break;
          default:
            this.nextOffsets = NEXT_OFFSETS[this.settings.rotationSystem]
            break
        }

        this.loop = loops[gametype].update
        this.onPieceSpawn = loops[gametype].onPieceSpawn
        for (const element of ["piece", "stack", "next", "hold"]) {
          if (gameData[element] != null) {
            for (const property of Object.keys(gameData[element])) {
              this[element][property] = gameData[element][property]
            }
          }
        }
        this.resize()
        loops[gametype].onInit(this)

        if (!this.userSettings.useAre) {
          this.piece.areLimit = 0
        }
        if (!this.userSettings.useLineClearAre) {
          this.piece.areLineLimit = 0
          this.piece.areLimitLineModifier = 0
          settings.settings.stillShowFullActionTextDespiteZeroLineClearAre = true
        } else {
          settings.settings.stillShowFullActionTextDespiteZeroLineClearAre = false
        }

        sound.killBgm()

        if (gametype === "beat") {
          this.settings.music = settings.game.beat.song
        }

        if (this.settings.musicLinePoints != null) {
          // eslint-disable-next-line no-unused-vars
          for (const point of this.settings.musicLinePoints) {
            this.musicLinePointCleared.push(false)
          }
        }
        {
          if (typeof this.settings.music === "string") {
            const string = this.settings.music
            this.settings.music = [string]
          }
        }
        sound.loadBgm(this.settings.music, gametype)

        let playSoundBankReadyGoSoundOrVoice = true

        if (
          sound.doesSoundBankUseReadyGoVoices &&
          settings.settings.voicebank != "off" &&
          settings.settings.voiceVolume != 0
        ) {
          playSoundBankReadyGoSoundOrVoice = false
        }

        if (playSoundBankReadyGoSoundOrVoice) {
          sound.add("ready")
        }
        sound.add("voxready")
        $("#message").classList.remove("dissolve")
        let readyText = locale.getString("ui", "ready")
        const delayChange = 0.05
        let delayAccum = -delayChange
        const newLabel = readyText.replace(/\S/g, (c) => {
          delayAccum += delayChange
          return (
            `<span class="ready-animation" style="--animation-delay: ${delayAccum}s">` +
            c +
            "</span>"
          )
        })
        readyText = newLabel
        $("#message").innerHTML = readyText
        this.onPieceSpawn(this)
        window.onresize = this.resize
        $(".game").classList.remove("paused")
        $(".game").classList.remove("zen-paused")
        this.request = requestAnimationFrame(this.gameLoop)
        document.documentElement.style.setProperty(
          "--current-background",
          `url("../img/bg/${this.settings.background}")`
        )
        setTimeout(() => {
          this.resize()
        }, 10)
      })
      .catch(function (err) {
        setTimeout(() => {
          throw err
        })
      })
  }
  unpause() {
    if (!this.isPaused) {
      return
    }
    sound.add("pause")
    this.isDirty = true
    this.isPaused = false
    if (this.type === "zen") {
      $(".game").classList.remove("zen-paused")
    } else {
      $(".game").classList.remove("paused")
    }
  }
  pause() {
    if (this.type === "nontwo") {
      return
    }
    if (this.isPaused || this.noUpdate) {
      return
    }
    $("#pause-label").textContent = locale.getString("ui", "pause")
    sound.add("pause")
    sound.playSeQueue()
    this.isPaused = true
    if (this.type === "zen") {
      $(".game").classList.add("zen-paused")
    } else {
      $(".game").classList.add("paused")
    }
  }
  hide() {
    if (this.type === "nontwo") this.die()
    $("#game-container").classList.add("hidden")
    this.isVisible = false
  }
  show() {
    $("#game-container").classList.remove("hidden")
    this.isVisible = true
  }
  resetBeatStuff() {
    $("#game-container").style.transitionTimingFunction = ""
    $("#game-container").style.transitionProperty = ""
    $("#game-container").style.transitionDuration = ""
    $("#game-container").style.transform = ""
    $("#game-container").classList.remove("sil")
    $("#stack").classList.remove("sil")
    $("#piece").classList.remove("sil")
  }
  timestamp() {
    return window.performance && window.performance.now
      ? window.performance.now()
      : new Date().getTime()
  }
  die() {
    cancelAnimationFrame(this.request)
    this.isDead = true
  }
  end(victory = false) {
    document.getElementById("myVideo").style.opacity = 0
    this.resetBeatStuff()
    this.isOver = true
    $("#combo-counter-container").classList.add("hidden")
    this.stack.endAlarm()
    this.noUpdate = true
    if (this.type === "zen" && settings.game.zen.holdType === "skip") {
      this.stats.splice(0, 0, "skipCount")
    }
    $("#end-stats").innerHTML = ""
    for (const statName of this.stats) {
      const append = this.appends[statName] ? this.appends[statName] : ""
      if (
        this.endingStats[statName] &&
        !"b2b piece pcCount skipCount".includes(statName)
      ) {
        $("#end-stats").innerHTML += `<b>${locale.getString(
          "ui",
          statName
        )}:</b> ${this.stat[statName]}${append}<br>`
      }
      switch (statName) {
        case "b2b":
          $("#end-stats").innerHTML += `<b>Max. ${locale
            .getString("action-text", "b2b")
            .substring(
              1,
              locale.getString("action-text", "b2b").length - 1
            )}:</b> ×${this.maxb2b - 1 < 0 ? 0 : this.maxb2b - 1}<br>`
          break
        case "piece":
          $("#end-stats").innerHTML += `<b>${locale.getString(
            "ui",
            "piece"
          )}:</b> ${this.stat["piece"]}<br>`
          $("#end-stats").innerHTML += `<b>Avg. PPS:</b> ${
            Math.round(
              (gameHandler.game.stat.piece /
                (gameHandler.game.timePassed / 1000)) *
                100
            ) / 100
          }<br>`
          break
        case "pcCount":
          $("#end-stats").innerHTML += `<b>${locale.getString(
            "action-text",
            "pc"
          )}:</b> ${this.stat["pcCount"]}<br>`
          break
        case "skipCount":
          $("#end-stats").innerHTML += `<b>${locale.getString(
            "ui",
            "skip"
          )}:</b> ${this.stat["skipCount"]}<br>`
          break
      }
    }
    if (this.timeGoal == null) {
      $("#end-stats").innerHTML += `<b>${locale.getString("ui", "inGameTime", [
        `<span style="font-weight: normal">${msToTime(this.timePassed)}</span>`,
      ])}</b><br>`
      $("#end-stats").innerHTML += `<b>${locale.getString(
        "ui",
        "realTimeAttack",
        [
          `<span style="font-weight: normal">${msToTime(
            this.timePassed + this.timePassedAre
          )}</span>`,
        ]
      )}</b><br>`
    }
    $("#kill-message-container").classList.remove("hidden")
    if (victory) {
      sound.add("excellent")
    } else {
      if (
        !(
          settings.settings.soundbank === "t99" &&
          settings.settings.voicebank !== "off"
        )
      ) {
        sound.add("ko")
      }
    }
    sound.killBgm()
    sound.killAllLoops()
    $("#game").classList.add("dead")
    endScreenTimeout = setTimeout(() => {
      sound.stopSeLoop("alarm")
      $("#kill-message-container").classList.add("hidden")
      sound.add("gameover")
      sound.add("voxgameover")
      $("#end-message").textContent = locale.getString("ui", "gameover")
      if (this.type === "handheld" || this.type === "deluxe") {
        $("#end-message").innerHTML = `${locale.getString(
          "ui",
          "gameover"
        )}<br><span class="small">${locale.getString(
          "ui",
          "pleasetryagain"
        )}♥</span>`
      }
      $("#end-message-container").classList.remove("hidden")
      $("#return-to-menu").textContent = locale.getString("ui", "returnToMenu")
    }, 1700)
  }
  calculateActionText(lineClear, isSpin, isMini, b2b, isClutch) {
    if (!settings.settings.displayActionText) {
      return
    }
    let clearName = [
      "",
      "single",
      "double",
      "triple",
      "tetra",
      "penta",
      "tetraplus",
    ][lineClear]
    if (lineClear > 6) {
      clearName = "tetraplus"
    }
    const spinName = isSpin ? "spin" : ""
    const miniName = isMini ? "mini" : ""
    const b2bName =
      b2b > 1 && lineClear > 0
        ? `<br>${locale.getString("action-text", "b2b")}`
        : ""
    const finalLabel = `${spinName}${clearName}${miniName}`
    if (finalLabel === "") {
      return
    }
    const orientation =
      this.piece.orientation === 0 || this.piece.orientation === 2
        ? "vertical"
        : "horizontal"
    let finalLocale = locale.getString("action-text", finalLabel, [
      `<b class="spin-start ${this.piece.lastSpinDirection} ${orientation}">${this.piece.name}</b>`,
    ])
    if (lineClear >= 4 && !isSpin) {
      const delayChange = 0.05
      let delayAccum = -delayChange
      const newLabel = finalLocale.replace(/\w/g, (c) => {
        delayAccum += delayChange
        return (
          `<span class="tetra-animation" style="--animation-delay: ${delayAccum}s">` +
          c +
          "</span>"
        )
      })
      finalLocale = newLabel
    }
    if (isSpin) {
      const duration = lineClear ? ".065s" : ".2s"
      const pulseCount = lineClear ? lineClear * 3 : 2
      finalLocale = `<span class="pulse-spin-text" style="--duration: ${duration}; --pulse-count: ${pulseCount}">${finalLocale}</span>`
    }
    if (isClutch) {
      this.displayActionText(`Clutch ${finalLocale + b2bName}`)
      this.displayClutch()
    } else {
      // if (!(finalLocale + b2bName === locale.getString('action-text', 'single') && settings.settings.stillShowFullActionTextDespiteZeroLineClearAre)) {
      this.displayActionText(finalLocale + b2bName)
      // }
    }
  }
  displayClutch() {
    const id = `at-${performance.now()}`
    const element = document.createElement("div")
    element.innerHTML = "CLUTCH"
    element.id = id
    element.classList.add("clutch-active")
    $("#clutch-message-container").appendChild(element)
    sound.add("clutch")
    setTimeout(() => {
      try {
        element.parentNode.removeChild(element)
      } catch (e) {
        // If you restart the game, these are deleted prematurely
        // This isn't actually a problem, so this is just to stop
        // errors from appearing
      }
    }, 500)
  }
  displayActionText(text, options) {
    options = {
      time: 2000,
      skipDefaultAnimation: false,
      additionalClasses: [],
      ...options,
    }
    if (!settings.settings.displayActionText) {
      return
    }
    const id = `at-${performance.now()}`
    const element = document.createElement("div")
    element.innerHTML = text
    element.classList.add("action-text")
    if (options.skipDefaultAnimation) {
      element.classList.add("skip-default-animation")
    }
    for (const className of options.additionalClasses) {
      element.classList.add(className)
    }
    const rotationVariance = 120
    const rotation = Math.random() * rotationVariance - rotationVariance / 2
    element.style.setProperty("--spin-amount", `${rotation}deg`)
    element.id = id
    $("#game-center").appendChild(element)
    setTimeout(() => {
      try {
        element.parentNode.removeChild(element)
      } catch (e) {
        // If you restart the game, these are deleted prematurely
        // This isn't actually a problem, so this is just to stop
        // errors from appearing
      }
    }, options.time)
  }
  resize() {
    const game = gameHandler.game
    const root = document.documentElement
    $("body").setAttribute("theme", settings.settings.theme)
    root.style.setProperty("--cell-size", `${game.cellSize}px`)
    root.style.setProperty("--matrix-width", game.settings.width)
    root.style.setProperty("--matrix-height-base", game.settings.height)
    for (const element of [
      "pieceCanvas",
      "nextMatrixPreviewCanvas",
      "stackCanvas",
      "nextCanvas",
      "nextSubCanvas",
      "holdCanvas",
      "particleCanvas",
    ]) {
      game[element].width = game[element].clientWidth
      game[element].height = game[element].clientHeight
    }
    let holdLabelSelection = "hold"
    if (game.hold.useSkip) {
      holdLabelSelection = "skip"
    }
    $("#hold-label").textContent = locale.getString("ui", holdLabelSelection)
    $("#next-label").textContent = locale.getString("ui", "next")
    $("#load-message").textContent = locale.getString("ui", "loading")
    game.stack.makeAllDirty()
    game.isDirty = true
    $("#stats").innerHTML = ""
    for (const statName of game.stats) {
      const stat = document.createElement("div")
      stat.classList.add("stat-group")
      const label = document.createElement("label")
      const number = document.createElement("div")
      if (statName === "b2b") {
        label.textContent = locale
          .getString("action-text", "b2b")
          .substring(1, locale.getString("action-text", "b2b").length - 1)
      } else if (statName === "pcCount") {
        label.textContent = locale.getString("action-text", "pc")
      } else {
        label.textContent = locale.getString("ui", statName)
      }
      number.innerHTML = game.stat[statName]
      number.id = `stat-${statName}`
      if (!game.smallStats[statName]) {
        number.classList.add("big")
      }
      stat.appendChild(label)
      stat.appendChild(number)
      $("#stats").appendChild(stat)
    }
    if (
      game.stack.width <= 4 &&
      (settings.settings.language === "ja_JP" ||
        settings.settings.language === "ko_KR")
    ) {
      $("#pause-label").classList.add("vertical")
    } else {
      $("#pause-label").classList.remove("vertical")
    }
    game.updateStats()
  }
  drawLockdown() {
    $("#pip-grid").innerHTML = ""
    for (let i = this.piece.manipulationLimit; i > 0; i--) {
      const pip = document.createElement("div")
      pip.classList.add("manip-pip")
      pip.id = `pip-${i}`
      $("#pip-grid").appendChild(pip)
    }
    if (!this.userSettings.useLockdownBar) {
      $("#pip-grid").classList.add("hidden")
      $("#lockdown").classList.add("hidden")
      $("#delay").classList.add("hidden")
      $("#infinity-symbol").classList.add("hidden")
      $("#infinity-symbol").classList.remove("gold")
      return
    }
    switch (this.piece.lockdownType) {
      case "extended":
        $("#pip-grid").classList.remove("hidden")
        $("#lockdown").classList.remove("hidden")
        $("#delay").classList.remove("hidden")
        $("#infinity-symbol").classList.add("hidden")
        $("#infinity-symbol").classList.remove("gold")
        break
      case "infinite":
        $("#pip-grid").classList.add("hidden")
        $("#lockdown").classList.remove("hidden")
        $("#delay").classList.remove("hidden")
        $("#infinity-symbol").classList.remove("hidden")
        $("#infinity-symbol").classList.remove("gold")
        break
      case "zen":
        $("#pip-grid").classList.add("hidden")
        $("#lockdown").classList.remove("hidden")
        $("#delay").classList.remove("hidden")
        $("#infinity-symbol").classList.remove("hidden")
        $("#infinity-symbol").classList.add("gold")
        break
      case "classic":
        $("#pip-grid").classList.add("hidden")
        $("#lockdown").classList.remove("hidden")
        $("#delay").classList.remove("hidden")
        $("#infinity-symbol").classList.add("hidden")
        $("#infinity-symbol").classList.remove("gold")
        break
      default:
        $("#pip-grid").classList.add("hidden")
        $("#lockdown").classList.add("hidden")
        $("#delay").classList.add("hidden")
        $("#infinity-symbol").classList.add("hidden")
        $("#infinity-symbol").classList.remove("gold")
        break
    }
  }
  updateStats() {
    for (const statName of this.stats) {
      if (statName === "skipCount") {
        continue
      }
      const prefix = this.prefixes[statName] ? this.prefixes[statName] : ""
      const append = this.appends[statName] ? this.appends[statName] : ""
      const value = this.stat[statName]
      $(`#stat-${statName}`).innerHTML = `${prefix}${value}${append}`
      if (statName === "piece") {
        $(
          "#stat-piece"
        ).innerHTML = `<span class="medium">${value}</span><br><b>${
          Math.round(gameHandler.game.pps * 100) / 100
        }</b>/${locale.getString("ui", "sec")}`
      }
      if (statName === "b2b") {
        $("#stat-b2b").innerHTML = `×${value}<br>(Max: ×${
          this.maxb2b - 1 < 0 ? 0 : this.maxb2b - 1
        })`
      }
    }
  }
  shiftMatrix(direction) {
    if (settings.settings.matrixSwayScale <= 0) {
      return
    }
    switch (direction) {
      case "left":
        this.matrix.velocity.left = 1
        this.matrix.velocity.right = 0
        break
      case "right":
        this.matrix.velocity.right = 1
        this.matrix.velocity.left = 0
        break
      case "up":
        this.matrix.velocity.up = 1
        this.matrix.velocity.down = 0
        break
      case "down":
        this.matrix.velocity.down = 1
        this.matrix.velocity.up = 0
        break
      default:
        throw new Error("Matrix shift direction undefined or incorrect")
    }
  }
  shakeMatrix(power = 1) {
    this.matrix.shakeVelocity.x = power
    this.matrix.shakeVelocity.y = power / 2
  }
  updateMatrix(ms) {
    const multiplier = ms / 16.666666666666
    const matrixPush = (direction) => {
      const axis = direction === "right" || direction === "left" ? "x" : "y"
      const modifier = direction === "right" || direction === "down" ? 1 : -1
      this.matrix.velocity[direction] = Math.min(
        this.matrix.velocity[direction],
        1
      )
      if (Math.abs(this.matrix.position[axis]) < 0.5) {
        this.matrix.position[axis] += 0.2 * modifier * multiplier
      }
      this.matrix.velocity[direction] -= 0.2 * multiplier
      this.matrix.velocity[direction] = Math.max(
        this.matrix.velocity[direction],
        0
      )
    }
    for (const direction of ["x", "y"]) {
      if (Math.abs(this.matrix.position[direction]) < 0.0001) {
        this.matrix.position[direction] = 0
      }
    }
    for (const directions of [
      ["left", "right", "x"],
      ["up", "down", "y"],
    ]) {
      if (
        this.matrix.velocity[directions[0]] === 0 &&
        this.matrix.velocity[directions[1]] === 0
      ) {
        const speed =
          1.033 + (settings.settings.matrixSwaySpeed / 100) ** 2 / 3.75
        this.matrix.position[directions[2]] /= 1 + (speed - 1) * multiplier
      } else {
        for (let i = 0; i < 2; i++) {
          const direction = directions[i]
          if (this.matrix.velocity[direction] !== 0) {
            matrixPush(direction)
          }
        }
      }
    }
    for (const direction of ["x", "y"]) {
      const modifier = Math.random() * 2 - 1
      this.matrix.position[direction] +=
        this.matrix.shakeVelocity[direction] * modifier
      this.matrix.shakeVelocity[direction] /= 1 + (1.1 - 1) * multiplier
      if (Math.abs(this.matrix.shakeVelocity[direction]) < 0.0001) {
        this.matrix.shakeVelocity[direction] = 0
      }
    }
    for (const element of ["#game-center", "#stats"]) {
      const scale =
        6 - Math.sqrt(25 * (settings.settings.matrixSwayScale / 100))
      $(element).style.transform = `translate(${
        this.matrix.position.x / scale
      }em, ${this.matrix.position.y / scale}em)`
    }
  }
  get cellSize() {
    const gameWidth =
      $("#game > .game-left").offsetWidth +
      $("#game > .game-center").offsetWidth +
      $("#game > .game-right").offsetWidth
    const gameAspectRatio = gameWidth / $("#game > .game-center").offsetHeight
    const base = Math.min(
      window.innerWidth / gameAspectRatio,
      window.innerHeight
    )
    return Math.floor(
      ((base / 1.2 / this.settings.height) * this.userSettings.size) / 100
    )
  }
  updateMusic() {
    if (this.settings.musicLinePoints != null) {
      for (let i = 0; i < this.musicLinePointCleared.length; i++) {
        const bool = this.musicLinePointCleared[i]
        if (!bool) {
          if (this.stat.line >= this.settings.musicLinePoints[i]) {
            sound.killBgm()
            sound.playBgm(this.settings.music[i + 1], this.type)
            this.musicLinePointCleared[i] = true
            continue
          }
          break
        }
      }
    }
  }
  gameLoop() {
    const game = gameHandler.game
    if (!game.isDead) {
      game.request = requestAnimationFrame(game.gameLoop)
      if (typeof game.loop === "function") {
        game.now = game.timestamp()
        game.deltaTime = (game.now - game.last) / 1000
        const msPassed = game.deltaTime * 1000
        if (!game.isPaused) {
          if (
            game.piece.startingAre < game.piece.startingAreLimit &&
            game.loadFinished
          ) {
            $("#ready-meter").max = game.piece.startingAreLimit
            $("#ready-meter").value =
              game.piece.startingAreLimit - game.piece.startingAre
            game.piece.startingAre += msPassed
          }
          if (!game.noUpdate) {
            if (!game.piece.inAre) {
              game.timePassed += msPassed
            } else if (game.piece.startingAre >= game.piece.startingAreLimit) {
              game.timePassedAre += msPassed
            }

            // GOALS
            if (game.lineGoal != null) {
              if (game.stat.line >= game.lineGoal) {
                $("#kill-message").textContent = locale.getString(
                  "ui",
                  "excellent"
                )
                sound.killVox()
                sound.add("voxexcellent")
                game.end(true)
              }
            }
            if (game.timeGoal != null) {
              if (
                (game.rtaLimit
                  ? game.timePassed + game.timePassedAre
                  : game.timePassed) >= game.timeGoal
              ) {
                game.timeGoal = null
                $("#kill-message").textContent = locale.getString(
                  "ui",
                  "timeOut"
                )
                sound.killVox()
                sound.add("voxtimeup")
                game.end()
              }
            }
            game.pps = game.stat.piece / (game.timePassed / 1000)
            // game.stat.pps = Math.round(game.pps * 100) / 100;
            game.updateStats()
            if (game.stack.alarmIsOn) {
              const cellSize = game.cellSize
              const redLineParticleSettings = {
                amount: 1,
                y: cellSize * game.bufferPeek,
                xRange: 1,
                yRange: 1,
                yVelocity: 0,
                xVariance: 2,
                yVariance: 0.2,
                yFlurry: 0.2,
                xDampening: 0.99,
                lifeVariance: 80,
                red: 255,
                blue: 51,
                green: 28,
              }
              game.particle.generate({
                x: 0,
                xVelocity: 2,
                ...redLineParticleSettings,
              })
              game.particle.generate({
                x: game.stack.width * cellSize,
                xVelocity: -2,
                ...redLineParticleSettings,
              })
              game.particle.generate({
                amount: 1,
                x: 0,
                y: cellSize * (game.bufferPeek + game.stack.height),
                xRange: game.stack.width * cellSize,
                yRange: 1,
                xVelocity: 0,
                yVelocity: 2,
                xVariance: 3,
                yVariance: 1,
                xFlurry: 0.2,
                yFlurry: 0.2,
                lifeVariance: 80,
                maxlife: 500,
              })
            }
            game.loop({
              ms: msPassed,
              piece: game.piece,
              stack: game.stack,
              hold: game.hold,
              particle: game.particle,
            })
          }
          game.particle.update(msPassed)
          game.updateMatrix(msPassed)
          const modules = ["piece", "stack", "next", "hold", "particle"]
          for (const moduleName of modules) {
            const currentModule = game[moduleName]
            if (currentModule.isDirty || game.isDirty) {
              if (moduleName === "stack" && game.isDirty) {
                game.stack.makeAllDirty()
              }
              currentModule.draw()
              currentModule.isDirty = false
            }
          }
          game.isDirty = false
        }
        if (game.piece.lockdownTypeLast !== game.piece.lockdownType) {
          game.drawLockdown()
        }
        game.piece.lockdownTypeLast = game.piece.lockdownType
        if (input.getGamePress("pause") && !game.noUpdate) {
          if (game.isPaused) {
            game.unpause()
          } else {
            game.pause()
          }
          if (!game.isVisible) {
            game.show()
            menu.close()
            game.unpause()
          }
        } else {
        }
        if (input.getGamePress("retry")) {
          game.mustReset = true
        }
        sound.playSeQueue()
        input.updateGameInput()
        if (game.mustReset) {
          game.isDead = true
        }
        if (game.isPaused) {
          $("#timer").classList.add("paused")
          $("#timer-real").classList.add("paused")
        } else {
          if (game.piece.inAre) {
            $("#timer").classList.add("paused")
          } else {
            $("#timer").classList.remove("paused")
          }
          if (game.piece.startingAre < game.piece.startingAreLimit) {
            $("#timer-real").classList.add("paused")
          } else {
            $("#timer-real").classList.remove("paused")
          }
        }
        if (game.timeGoal != null) {
          if (game.rtaLimit) {
            $("#timer").innerHTML = locale.getString("ui", "inGameTime", [
              msToTime(game.timePassed),
            ])
            $("#timer-real").innerHTML = locale.getString(
              "ui",
              "realTimeAttack",
              [msToTime(game.timeGoal - game.timePassed - game.timePassedAre)]
            )
          } else {
            $("#timer").innerHTML = locale.getString("ui", "inGameTime", [
              msToTime(game.timeGoal - game.timePassed),
            ])
            $("#timer-real").innerHTML = locale.getString(
              "ui",
              "realTimeAttack",
              [msToTime(game.timePassed + game.timePassedAre)]
            )
          }
        } else {
          $("#timer").innerHTML = locale.getString("ui", "inGameTime", [
            msToTime(game.timePassed),
          ])
          $("#timer-real").innerHTML = locale.getString(
            "ui",
            "realTimeAttack",
            [msToTime(game.timePassed + game.timePassedAre)]
          )
        }
        game.last = game.now
      }
    } else {
      if (game.mustReset) {
        gameHandler.reset()
      }
    }
  }
  makeSprite(
    colors = [
      "red",
      "orange",
      "yellow",
      "green",
      "lightBlue",
      "blue",
      "purple",
      "white",
      "black",
    ],
    types = ["mino", "ghost", "stack"],
    skin = settings.settings.skin === "auto"
      ? SKIN_SETS[this.settings.rotationSystem]
      : settings.settings.skin
  ) {
    this.loadFinished = false
    $("#sprite").innerHTML = ""
    $("#load-message").classList.remove("hidden")
    const toLoad = colors.length * types.length
    let loaded = 0
    for (const type of types) {
      for (const color of colors) {
        const img = document.createElement("img")
        img.src = `img/skin/${skin}/${type}-${color}.svg`
        img.id = `${type}-${color}`
        $("#sprite").appendChild(img)
        const onLoad = () => {
          loaded++
          if (loaded >= toLoad) {
            this.loadFinished = true
            $("#load-message").classList.add("hidden")
          }
          this.isDirty = true
        }

        if (img.complete) {
          onLoad()
        } else {
          img.addEventListener("load", onLoad)
          img.addEventListener("error", function () {
            // alert('error');
          })
        }
      }
    }
  }
  addScore(name, multiplier = 1) {
    const scoreTable = SCORE_TABLES[this.settings.scoreTable]
    let score = scoreTable[name]
    if (score != null) {
      score *= multiplier
      if (scoreTable.levelMultiplied.indexOf(name) !== -1) {
        score *= this.stat.level + scoreTable.levelAdditive
      }
      if (scoreTable.b2bMultiplied.indexOf(name) !== -1 && this.b2b > 1) {
        score *= scoreTable.b2bMultiplier
      }
      this.stat.score += score
    }
  }
}
