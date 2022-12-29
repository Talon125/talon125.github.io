import GameModule from "./game-module.js"
import $, { clearCtx, resetAnimation } from "../shortcuts.js"
import * as randomizer from "./modules/randomizers.js"
import {
  PIECE_SETS,
  PIECES,
  MONOMINO_PIECES,
  DOMINO_PIECES,
  TROMINO_PIECES,
  PENTOMINO_PIECES,
  INITIAL_ORIENTATION,
} from "../consts.js"
import sound from "../sound.js"
import settings from "../settings.js"

export default class Hold extends GameModule {
  constructor(parent, ctx) {
    super(parent)
    this.ctx = ctx
    this.pieceName = null
    this.isLocked = false
    this.ihs = false
    this.ihsAmount = 0
    this.isDisabled = false
    this.useSkip = false
    this.hasHeld = false
    this.holdAmount = 0
    this.holdAmountLimit = 0
    this.gainHoldOnPlacement = false
  }
  getPiece() {
    return this.pieceName
      ? this.pieceName
      : this.parent.piece.inAre
      ? this.parent.next.queue[1]
      : this.parent.next.queue[0]
  }
  hold() {
    if (this.parent.type !== "zen") {
      if (
        (this.isLocked && !this.useSkip) ||
        this.isDisabled ||
        (this.holdAmount <= 0 && this.holdAmountLimit > 0)
      ) {
        return
      }
      if (this.holdAmountLimit > 0) {
        this.holdAmount--
      }
    }
    this.hasHeld = true
    if (this.ihs) {
      if (this.useSkip) {
        sound.add("initialskip")
        this.parent.stat.skipCount++
      } else {
        sound.add("initialhold")
      }
    } else {
      if (this.useSkip) {
        sound.add("skip")
        this.parent.stat.skipCount++
      } else {
        sound.add("hold")
      }
    }
    this.ihsAmount--
    if (this.ihsAmount <= 0) {
      this.ihs = false
    }
    const swapPiece = this.pieceName
    this.pieceName = this.parent.piece.name
    if (swapPiece == null || this.useSkip) {
      this.parent.piece.new()
    } else {
      this.parent.piece.new(swapPiece)
    }
    this.isDirty = true
    this.isLocked = true
    resetAnimation("#hold-container", "flash")
  }
  draw() {
    if (this.isDisabled) {
      $("#hold-container").classList.add("hidden")
    } else {
      $("#hold-container").classList.remove("hidden")
    }
    if (this.useSkip) {
      if (this.parent.type !== "zen") {
        $("#skip-amount").textContent = this.holdAmount
      }
      // else { $('#skip-amount').innerHTML = '∞'; }
      else {
        $("#skip-amount").innerHTML = this.parent.stat.skipCount
      }
      return
    } else {
      $("#skip-amount").textContent = ""
    }
    if (this.pieceName === null) {
      return
    }
    if (this.parent.type !== "zen") {
      if (this.isLocked || this.useSkip) {
        $("#hold").classList.add("locked")
      } else {
        $("#hold").classList.remove("locked")
      }
    }
    clearCtx(this.ctx)
    if (this.isDisabled) {
      return
    }
    let shape
    switch (settings.settings.shapeOverride) {
      case "mono":
        shape =
          MONOMINO_PIECES[this.pieceName].shape[
            INITIAL_ORIENTATION[this.parent.rotationSystem][this.pieceName]
          ]
        break
      case "do":
        shape =
          DOMINO_PIECES[this.pieceName].shape[
            INITIAL_ORIENTATION[this.parent.rotationSystem][this.pieceName]
          ]
        break
      case "tro":
        shape =
          TROMINO_PIECES[this.pieceName].shape[
            INITIAL_ORIENTATION[this.parent.rotationSystem][this.pieceName]
          ]
        break
      case "pento":
        shape =
          PENTOMINO_PIECES[this.pieceName].shape[
            INITIAL_ORIENTATION[this.parent.rotationSystem][this.pieceName]
          ]
        break
      default:
        shape =
          PIECES[this.pieceName].shape[
            INITIAL_ORIENTATION[this.parent.rotationSystem][this.pieceName]
          ]
        break
    }
    const cellSize = this.parent.cellSize
    const offset = this.parent.nextOffsets[this.pieceName]
    const ctx = this.ctx
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        const color = this.parent.colors[this.pieceName]
        const img = document.getElementById(`mino-${color}`)
        const isFilled = shape[y][x]
        if (isFilled) {
          const xPos = x * cellSize + offset[0] * cellSize
          const yPos = y * cellSize + offset[1] * cellSize
          img.height = cellSize
          ctx.drawImage(img, xPos, Math.floor(yPos), cellSize, cellSize)
        }
      }
    }
  }
}
