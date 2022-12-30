import input from "../../input.js"

export default function sonicDrop(arg, safelock = false) {
  if (safelock) {
    if (input.getGamePress("hardDrop")) {
      arg.piece.realSonicDrop()
      if (arg.piece.breakHoldingTimeOnSoftDrop) {
        arg.piece.holdingTime = arg.piece.holdingTimeLimit
      }
    }
  } else {
    if (input.getGameDown("hardDrop")) {
      arg.piece.realSonicDrop()
      if (arg.piece.breakHoldingTimeOnSoftDrop) {
        arg.piece.holdingTime = arg.piece.holdingTimeLimit
      }
    }
  }
}
