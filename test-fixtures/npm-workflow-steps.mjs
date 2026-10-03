import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
} from "../src/checks/general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";

export function npm12WorkflowSteps(commands = []) {
  return [
    { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
    { run: npm12InstallCommand },
    { run: npm12VersionCheckCommand },
    ...commands.map((run) => ({ run })),
  ];
}

export function workflowCommands(steps) {
  return steps.flatMap((step, index) =>
    typeof step.run === "string" ? [{ command: step.run, step, index }] : [],
  );
}
