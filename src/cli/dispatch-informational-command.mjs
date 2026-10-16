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
      [
        "Usage: eliware-test [--help|--version]",
        "       eliware-test [--debug-timing] [focused-test-path ...] [-- Jest arguments]",
        "       eliware-test [--debug-timing] --lint|--format|--format-check|--audit|--pack [mode arguments]",
        "Focused tests: pass one or more paths, for example eliware-test tests/one.test.mjs tests/two.test.mjs [-- Jest arguments].",
        "Use .test.* or .spec.* files in tests/. Supported extensions are .js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, and .cts.",
        "Focused-test arguments after -- go to Jest.",
        "Arguments before a tool mode are rejected. Mode arguments follow the mode or -- and must match that mode's allowlist.",
        "--debug-timing is wrapper-only. It can be listed once before a focused path or tool mode, or alone for aggregate validation.",
        "Do not put --debug-timing after --.",
      ].join("\n"),
    );
    return 0;
  }
  return null;
}
