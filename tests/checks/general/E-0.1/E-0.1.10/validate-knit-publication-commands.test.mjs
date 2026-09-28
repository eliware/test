import { expect, test } from "@jest/globals";
import { validateKnitPublicationCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-publication-commands.mjs";

test("rejects publication, deployment, release, and destructive commands", () => {
  for (const [command, args] of [
    ["npm", ["publish"]],
    ["docker", ["push", "ghcr.io/example/app"]],
    ["kubectl", ["apply", "-f", "production.yaml"]],
    ["git", ["push", "origin", "main"]],
    ["git", ["checkout", "--", "README.md"]],
    ["git", ["restore", "README.md"]],
    ["rm", ["-rf", "."]],
    ["rm", ["-r", "."]],
    ["rm", ["--recursive", "."]],
    ["rm", ["--force", "--recursive", "."]],
    ["rm", ["-fR", "."]],
  ]) {
    expect(validateKnitPublicationCommands([{ kind: "spawnSync", command, args }])).toContain(
      "must not publish, deploy, release, or mutate external state",
    );
  }
});

test("allows validation commands and incidental command text", () => {
  expect(
    validateKnitPublicationCommands([
      { kind: "spawnSync", command: "npm", args: ["test"] },
      { kind: "echo", command: "echo", args: ["npm publish"] },
    ]),
  ).toBeNull();
  expect(validateKnitPublicationCommands([{ command: "rm", args: ["--", "-r"] }])).toBeNull();
  expect(validateKnitPublicationCommands([{ command: "rm", args: ["file.txt"] }])).toBeNull();
  expect(validateKnitPublicationCommands([{ command: "npm" }])).toBeNull();
});
