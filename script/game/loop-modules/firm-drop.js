import input from "../../input.js"
import { framesToMs } from "../../shortcuts.js"

export default function firmDrop(arg, frameGravity = 1, safelock = false) {
  if (safelock) {
    if (input.getGamePress("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
      } else {
        arg.piece.mustLock = true
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  } else {
    if (input.getGameDown("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
      } else {
        arg.piece.mustLock = true
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  }
}
