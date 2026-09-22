import packageMetadata from "../../package.json" with { type: "json" };

export function dispatchInformationalCommand(args, write) {
  if (args.length === 1 && args[0] === "--version") {
    write(packageMetadata.version);
    return 0;
  }
  if (args.length === 1 && args[0] === "--help") {
    write(
      "Usage: eliware-test [--help|--version|--lint|--format|--format-check|--audit|--pack|--debug-timing] [focused-test-path...]",
    );
    return 0;
  }
  return null;
}
