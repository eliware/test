import { expect, test } from "@jest/globals";
import { parse } from "yaml";
import { validateWorkflowPostTestCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-post-test-commands.mjs";

test("allows arbitrary commands after npm test except publishing commands", () => {
  for (const command of [
    "echo done",
    "npm run typecheck",
    "rm -rf build",
    "node scripts/deploy.mjs",
    "echo ready && npm run check",
    "npm test\ntouch .tmp",
  ]) {
    expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toBeNull();
  }
  for (const command of ["npm publish", "docker push ghcr.io/eliware/example:latest"]) {
    expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toContain(
      "publishing commands",
    );
  }
  const testStep = { run: "npm test" };
  const repositoryCheck = { run: "node scripts/use-ci-credential.mjs" };
  expect(
    validateWorkflowPostTestCommands(
      "ci.yml",
      [
        { command: "npm test", step: testStep, index: 1 },
        { command: repositoryCheck.run, step: repositoryCheck, index: 2 },
      ],
      1,
      [{ run: "npm ci" }, testStep, repositoryCheck],
    ),
  ).toBeNull();
  const publishStep = { run: "npm publish" };
  expect(
    validateWorkflowPostTestCommands(
      "ci.yml",
      [
        { command: "npm test", step: testStep, index: 1 },
        { command: publishStep.run, step: publishStep, index: 2 },
      ],
      1,
      [{ run: "npm ci" }, testStep, publishStep],
    ),
  ).toContain("publishing commands");
});

test("rejects malformed post-test steps and unsupported action forms", () => {
  const testStep = { run: "npm test" };
  const malformedSteps = [
    { name: "no executable" },
    { script: "echo bypass" },
    { run: "echo done", uses: "actions/upload-artifact@v6" },
    { run: "echo done", with: { path: "report.txt" } },
  ];
  for (const reportingStep of malformedSteps) {
    expect(
      validateWorkflowPostTestCommands(
        "ci.yml",
        [{ command: "npm test", step: testStep, index: 0 }],
        0,
        [testStep, reportingStep],
      ),
    ).toContain("publishing commands");
  }
  expect(
    validateWorkflowPostTestCommands(
      "ci.yml",
      [{ command: "npm test", step: testStep, index: 0 }],
      0,
      [testStep, { uses: "untrusted/reporting@v1", with: { value: "safe" } }],
    ),
  ).toContain("publishing commands");
  expect(validateWorkflowPostTestCommands("ci.yml", [], 0, "invalid steps")).toContain(
    "publishing commands",
  );
  const testCommand = { run: "npm test" };
  expect(
    validateWorkflowPostTestCommands(
      "ci.yml",
      [{ command: "npm test", step: testCommand, index: 0 }],
      0,
      "malformed steps",
    ),
  ).toContain("publishing commands");
  for (const [command, step] of [
    ["npm run typecheck", { run: "npm run typecheck", if: "always()" }],
    ["npm run build", { run: "npm run build", "continue-on-error": true }],
  ]) {
    expect(
      validateWorkflowPostTestCommands("ci.yml", [{ command, step, index: 1 }], 0, [
        { run: "npm test" },
        step,
      ]),
    ).toContain("publishing commands");
  }
});

test("allows multiline shell commands after npm test once parsed from YAML", () => {
  const workflow = parse("steps:\n  - run: |\n      echo done\n      touch .env\n");
  const command = workflow.steps[0].run.trim();
  expect(validateWorkflowPostTestCommands("ci.yml", [{ command }], -1)).toBeNull();
});

test("uses original workflow positions when setup steps have no run command", () => {
  const commandStep = { run: "npm publish" };
  expect(
    validateWorkflowPostTestCommands(
      "ci.yml",
      [{ command: commandStep.run, step: commandStep }],
      1,
      [{ uses: "actions/checkout@v4" }, { run: "npm test" }, commandStep],
    ),
  ).toContain("publishing commands");
});

test("checks actions after npm test against the reporting allowlist", () => {
  for (const actionStep of [
    { uses: "actions/upload-artifact@v6" },
    { uses: "actions/upload-artifact@v6", with: { path: "**/*" } },
    { uses: "actions/upload-artifact@v6", env: { TOKEN: "secret" } },
  ]) {
    expect(
      validateWorkflowPostTestCommands("ci.yml", [], 0, [{ run: "npm test" }, actionStep]),
    ).toContain("publishing commands");
  }
  expect(
    validateWorkflowPostTestCommands("ci.yml", [], 0, [
      { run: "npm test" },
      { uses: "untrusted/action@v1" },
    ]),
  ).toContain("publishing commands");
  expect(
    validateWorkflowPostTestCommands(
      "publish.yml",
      [],
      0,
      [
        { run: "npm test" },
        {
          uses: "actions/attest@v4",
          with: {
            subjectName: "ghcr.io/eliware/example",
            subjectDigest: "${{ steps.push.outputs.digest }}",
            pushToRegistry: true,
          },
        },
      ],
      { allowAttestation: true },
    ),
  ).toBeNull();
  expect(
    validateWorkflowPostTestCommands(
      "publish.yml",
      [],
      0,
      [{ run: "npm test" }, { uses: "actions/attest@v4" }],
      { allowAttestation: true },
    ),
  ).toContain("publishing commands");
  for (const withValues of [
    {},
    { subjectName: "ghcr.io/eliware/example", pushToRegistry: true },
    {
      subjectName: "ghcr.io/eliware/example",
      subjectDigest: "${{ steps.push.outputs.digest }}",
      pushToRegistry: false,
    },
  ]) {
    expect(
      validateWorkflowPostTestCommands(
        "publish.yml",
        [],
        0,
        [{ run: "npm test" }, { uses: "actions/attest@v4", with: withValues }],
        { allowAttestation: true },
      ),
    ).toContain("publishing commands");
  }
  expect(
    validateWorkflowPostTestCommands("ci.yml", [], 0, [
      { run: "npm test" },
      { uses: "actions/attest@v4" },
    ]),
  ).toContain("publishing commands");
});
