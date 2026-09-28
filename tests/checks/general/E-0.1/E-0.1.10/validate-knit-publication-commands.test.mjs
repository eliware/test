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
    ["rm", ["-rf", "--", "target"]],
  ]) {
    expect(validateKnitPublicationCommands([{ kind: "spawnSync", command, args }])).toContain(
      "only the approved synchronization and validation commands",
    );
  }
});

test("allows only the approved synchronization and validation commands", () => {
  expect(
    validateKnitPublicationCommands([
      { kind: "spawnSync", command: "npm", args: ["test"] },
      { kind: "spawnSync", command: "git", args: ["pull", "--ff-only", "origin", "main"] },
      { kind: "spawnSync", command: "npm", args: ["ci"] },
    ]),
  ).toBeNull();
  for (const call of [
    { kind: "spawnSync", command: "git", args: ["clean", "-fd"] },
    { kind: "spawnSync", command: "git", args: ["revert", "HEAD"] },
    { kind: "spawnSync", command: "npm", args: ["install"] },
    { kind: "spawnSync", command: "echo", args: ["validation"] },
    { kind: "execSync", command: "npm test", args: [] },
    { command: "rm", args: ["--", "-r"] },
    { command: "npm" },
  ]) {
    expect(validateKnitPublicationCommands([call])).toContain(
      "only the approved synchronization and validation commands",
    );
  }
});
