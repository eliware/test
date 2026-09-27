import { expect, test } from "@jest/globals";
import { parse } from "yaml";
import { validateWorkflowPostTestCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-post-test-commands.mjs";

test("allows reporting commands after npm test", () => {
  for (const command of ["echo done", "printf done"]) {
    expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toBeNull();
  }
});

test("rejects other commands after npm test", () => {
  expect(validateWorkflowPostTestCommands("ci.yml", [{ command: "rm -rf ." }], -1)).toContain(
    "reporting commands after npm test",
  );
});

test("rejects shell expansion, redirection, and newline command injection", () => {
  for (const command of [
    'echo "$(touch .env)"',
    'echo "`touch .env`"',
    "echo safe > .env",
    "echo safe\ntouch .env",
    "printf safe\r\ntouch .env",
  ]) {
    expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toContain(
      "reporting commands after npm test",
    );
  }
});

test("rejects a multiline reporting block scalar after YAML parsing", () => {
  const workflow = parse("steps:\n  - run: |\n      echo done\n      touch .env\n");
  const command = workflow.steps[0].run.trim();
  expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toContain(
    "reporting commands after npm test",
  );
});

test("uses original workflow positions when setup steps have no run command", () => {
  const commandStep = { run: "rm -rf ." };
  expect(
    validateWorkflowPostTestCommands(
      "ci.yml",
      [{ command: commandStep.run, step: commandStep }],
      1,
      [{ uses: "actions/checkout@v4" }, { run: "npm test" }, commandStep],
    ),
  ).toContain("reporting commands after npm test");
});

test("checks actions after npm test against the reporting allowlist", () => {
  expect(
    validateWorkflowPostTestCommands("ci.yml", [], 0, [
      { run: "npm test" },
      { uses: "actions/upload-artifact@v6" },
    ]),
  ).toBeNull();
  expect(
    validateWorkflowPostTestCommands("ci.yml", [], 0, [
      { run: "npm test" },
      { uses: "actions/upload-artifact@v6", "continue-on-error": true },
    ]),
  ).toContain("approved reporting actions");
  expect(
    validateWorkflowPostTestCommands("ci.yml", [], 0, [
      { run: "npm test" },
      { uses: "untrusted/action@v1" },
    ]),
  ).toContain("approved reporting actions");
  expect(
    validateWorkflowPostTestCommands(
      "publish.yml",
      [],
      0,
      [{ run: "npm test" }, { uses: "actions/attest@v4" }],
      { allowAttestation: true },
    ),
  ).toBeNull();
  expect(
    validateWorkflowPostTestCommands("ci.yml", [], 0, [
      { run: "npm test" },
      { uses: "actions/attest@v4" },
    ]),
  ).toContain("approved reporting actions");
});
