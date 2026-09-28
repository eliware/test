import packageMetadata from "../../package.json" with { type: "json" };

export function dispatchInformationalCommand(args, write) {
  const informational = args.filter(
    (argument) => argument === "--help" || argument === "--version",
  );
  if (informational.length > 1)
    throw new Error("Informational commands cannot be repeated or combined.");
  if (informational.length === 1 && args.length !== 1)
    throw new Error("Informational commands cannot be combined with validation arguments.");
  if (informational.length === 1 && informational[0] === "--version") {
    write(packageMetadata.version);
    return 0;
  }
  if (informational.length === 1 && informational[0] === "--help") {
    write(
      "Usage: eliware-test [--help|--version|--lint|--format|--format-check|--audit|--pack|--debug-timing] [focused-test-path]\nFocused tests: eliware-test tests/path.test.mjs or tests/path.spec.ts [-- Jest arguments]\nSupply one .test.* or .spec.* file under tests/; supported extensions are .js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, and .cts. Arguments after -- are forwarded to Jest.",
    );
    return 0;
  }
  return null;
}
