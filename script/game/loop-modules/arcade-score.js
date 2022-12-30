export default function arcadeScore(arg, drop = 0, multiplier = 1) {
  if (
    arg.piece.are >= arg.piece.areLimit + arg.piece.areLimitLineModifier ||
    (!arg.piece.inAre && arg.stack.toCollapse.length)
  ) {
    arg.stack.arcadeScore(drop, multiplier)
  }
}
