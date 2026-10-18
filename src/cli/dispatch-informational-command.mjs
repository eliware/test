import packageMetadata from "../../package.json" with { type: "json" };
import { helpText } from "./help-text.mjs";

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
    write(helpText);
    return 0;
  }
  return null;
}
