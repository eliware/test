function isWrappedTestCommand(command, names) {
  const runner = names.join("|");
  const wrapper = new RegExp(
    `^(?:npx|npm\\s+exec|pnpm\\s+(?:exec|dlx)|yarn\\s+(?:exec|dlx)|bunx)(?:\\s+[^;|&]+)?\\s+(?:--\\s+)?(?:${runner})(?:\\s|$)`,
    "iu",
  );
  return wrapper.test(command);
}
export default isWrappedTestCommand;
