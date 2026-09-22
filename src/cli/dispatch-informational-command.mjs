import packageMetadata from "../../package.json" with { type: "json" };

export function dispatchInformationalCommand(args, write) {
  const informational = args.filter((argument) => argument === "--help" || argument === "--version");
  if (informational.length === 1 && informational[0] === "--version") {
    write(packageMetadata.version);
    return 0;
  }
  if (informational.length === 1 && informational[0] === "--help") {
    write(
      "Usage: eliware-test [--help|--version|--lint|--format|--format-check|--audit|--pack|--debug-timing] [focused-test-path...]",
    );
    return 0;
  }
  return null;
}
