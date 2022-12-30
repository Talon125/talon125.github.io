import input from "../../input.js"
import { gravity } from "./gravity.js"

export default function softDrop(arg, multiplier = 20, zen = false) {
  if (input.getGameDown("softDrop")) {
    if (zen) {
      gravity(arg)
    }
    arg.piece.gravityMultiplier = multiplier
    if (!arg.piece.isLanded) {
      arg.piece.genPieceParticles()
    }
  } else {
    arg.piece.gravityMultiplier = 1
  }
}
