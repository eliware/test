import packageMetadata from "../../package.json" with { type: "json" };

export function dispatchInformationalCommand(args, write) {
  if (args.includes("--version")) {
    write(packageMetadata.version);
    return 0;
  }
  if (args.includes("--help")) {
    write(
      "Usage: eliware-test [--help|--version|--lint|--format|--format-check|--audit|--pack|--debug-timing|--ignore-100x4|--ignore-monolith-limits] [focused-test-path...]",
    );
    return 0;
  }
  return null;
}
