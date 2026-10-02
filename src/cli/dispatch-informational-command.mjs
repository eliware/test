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
      "Usage: eliware-test [--help|--version]\n       eliware-test [--debug-timing] [focused-test-path [-- Jest arguments]]\n       eliware-test [--debug-timing] --lint|--format|--format-check|--audit|--pack [mode arguments]\nFocused tests: eliware-test [focused-test-path]; for example, eliware-test tests/path.test.mjs or tests/path.spec.ts [-- Jest arguments]\nSupply one .test.* or .spec.* file under tests/; supported extensions are .js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, and .cts. Focused-test arguments after -- are forwarded to Jest. Arguments before a tool mode are rejected; mode arguments follow the mode or -- and must satisfy that mode's allowlist. --debug-timing is wrapper-only, may appear once before a focused path or tool mode (or alone for aggregate validation), and cannot follow --.",
    );
    return 0;
  }
  return null;
}
