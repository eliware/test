#!/usr/bin/env node
import { runCli } from "../src/cli/run-cli.mjs";

const exitCode = await runCli(process.argv.slice(2));
if (exitCode !== 0) {
  const descriptions = {
    8: "Jest failure",
    10: "coverage failure",
    12: "lint failure",
    14: "internal tool failure",
    17: "package-check failure",
    18: "convention, configuration, argument, format, or format-check failure",
  };
  process.stdout.write(`Exit-code: ${exitCode} (${descriptions[exitCode] ?? "unclassified failure"})\n`);
}
process.exitCode = exitCode;
