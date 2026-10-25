export function isRuntimeTestCommand(command) {
  return (
    /^node(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?:\s|$)/iu.test(command) ||
    /^(?:bun|deno)\s+test(?:\s|$)/iu.test(command)
  );
}
