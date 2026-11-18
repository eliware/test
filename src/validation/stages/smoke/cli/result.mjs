export default function writeSmokeCliResult(result, write) {
  if (result instanceof Error) {
    write(`Tarball consumer smoke failed: ${result.message}`);
    return 17;
  }
  if (typeof result !== "string") {
    write("Tarball consumer smoke failed: smoke returned a non-string result.");
    return 17;
  }
  write(result);
  return result.startsWith("Smoke passed:") ? 0 : 17;
}
