import { expect, test } from "@jest/globals";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
  validateNpm12WorkflowSetup,
} from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";

const steps = [
  { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
  { run: npm12InstallCommand },
  { run: npm12VersionCheckCommand },
  { run: "npm ci" },
  { run: "npm test" },
];
const commands = steps.flatMap((step, index) =>
  step.run ? [{ command: step.run, index, step }] : [],
);

test("defines a deterministic active npm version check", () => {
  expect(npm12VersionCheckCommand).toContain('execFileSync("npm",["--version"]');
  expect(npm12VersionCheckCommand).toContain('Number(v.split(".")[0])<12');
  expect(npm12VersionCheckCommand).toContain("process.exit(1)");
});

test("accepts npm 12 provisioning and verification before dependency installation", () => {
  expect(validateNpm12WorkflowSetup("ci.yaml", commands, 3, steps)).toBeNull();
  expect(
    validateNpm12WorkflowSetup("ci.yaml", commands, 3, steps, { requireSetup: true }),
  ).toBeNull();
});

test.each(["v7", "v7.0.0", "v7.1.2"])("accepts approved setup-node version %s", (version) => {
  const versionedSteps = steps.map((step, index) =>
    index === 0 ? { ...step, uses: `actions/setup-node@${version}` } : step,
  );
  const versionedCommands = commands.map((entry) => ({
    ...entry,
    step: versionedSteps[steps.indexOf(entry.step)],
  }));
  expect(validateNpm12WorkflowSetup("ci.yaml", versionedCommands, 3, versionedSteps)).toBeNull();
});

test("rejects conditional setup and a Node.js version other than 26", () => {
  const conditional = steps.map((step) => ({ ...step }));
  conditional[1].if = "always()";
  const conditionalCommands = commands.map((entry) => ({
    ...entry,
    step: conditional[steps.indexOf(entry.step)],
  }));
  expect(validateNpm12WorkflowSetup("ci.yaml", conditionalCommands, 3, conditional)).toContain(
    "must install npm@12 globally",
  );
  const wrongNode = steps.map((step) => ({ ...step }));
  wrongNode[0].with = { "node-version": 20 };
  const wrongNodeCommands = commands.map((entry) => ({
    ...entry,
    step: wrongNode[steps.indexOf(entry.step)],
  }));
  expect(validateNpm12WorkflowSetup("ci.yaml", wrongNodeCommands, 3, wrongNode)).toContain(
    "must install npm@12 globally",
  );
});

test("rejects setup-node steps that can be skipped or tolerated", () => {
  for (const field of ["if", "continue-on-error", "continueOnError"]) {
    const unsafe = steps.map((step) => ({ ...step }));
    unsafe[0][field] = field === "if" ? "always()" : true;
    const unsafeCommands = commands.map((entry) => ({
      ...entry,
      step: unsafe[steps.indexOf(entry.step)],
    }));
    expect(validateNpm12WorkflowSetup("ci.yaml", unsafeCommands, 3, unsafe)).toContain(
      "must install npm@12 globally",
    );
  }
  const duplicate = [
    ...steps,
    { uses: "actions/setup-node@v7", if: "always()", with: { "node-version": 26 } },
  ];
  expect(validateNpm12WorkflowSetup("ci.yaml", commands, 3, duplicate)).toContain(
    "must install npm@12 globally",
  );
});

test("resolves step references when normalized commands do not carry indexes", () => {
  const unindexed = commands.map(({ command, step }) => ({ command, step }));
  expect(validateNpm12WorkflowSetup("ci.yaml", unindexed, 3, steps)).toBeNull();
  const unlinked = unindexed.map(({ command }) => ({ command }));
  expect(validateNpm12WorkflowSetup("ci.yaml", unlinked, 3, steps)).toContain(
    "must install npm@12 globally",
  );
});

test.each([
  ["missing installation", commands.filter(({ command }) => command !== npm12InstallCommand)],
  ["missing version check", commands.filter(({ command }) => command !== npm12VersionCheckCommand)],
  [
    "reversed setup",
    [
      { command: npm12VersionCheckCommand, index: 1 },
      { command: npm12InstallCommand, index: 2 },
      { command: "npm ci", index: 3 },
    ],
  ],
  ["duplicate installation", [...commands, commands[1]]],
  ["unsupported setup-node", commands],
])("rejects %s", (name, setupCommands) => {
  const workflowSteps =
    name === "unsupported setup-node"
      ? [{ ...steps[0], uses: "actions/setup-node@v6" }, ...steps.slice(1)]
      : steps;
  expect(validateNpm12WorkflowSetup("ci.yaml", setupCommands, 3, workflowSteps)).toContain(
    "must install npm@12 globally",
  );
});

test("does not impose npm provisioning on unrelated jobs without npm ci", () => {
  expect(validateNpm12WorkflowSetup("ci.yaml", [{ command: "echo reporting" }], 1)).toBeNull();
  expect(
    validateNpm12WorkflowSetup(
      "ci.yaml",
      [
        { command: npm12InstallCommand },
        { command: npm12VersionCheckCommand },
        { command: "npm ci" },
      ],
      2,
    ),
  ).toContain("must install npm@12 globally");
});
