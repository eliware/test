export function isPermittedPostTestCommand(commandIndex, testIndex, enabled) {
  return enabled && testIndex >= 0 && commandIndex > testIndex;
}
