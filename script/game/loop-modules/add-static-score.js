export default function addStaticScore(arg, score = 0) {
  if (
    arg.piece.are >= arg.piece.areLimit + arg.piece.areLimitLineModifier ||
    (!arg.piece.inAre && arg.stack.toCollapse.length)
  ) {
    arg.stack.addStaticScore(score)
  }
}
