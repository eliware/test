import { npmLatestInstallCommand } from "../src/checks/general/E-0.1/E-0.1.24/validate-npm-install-workflow-setup.mjs";

export function npmWorkflowSteps(commands = []) {
  return [
    { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
    { run: npmLatestInstallCommand },
    ...commands.map((run) => ({ run })),
  ];
}

export function workflowCommands(steps) {
  return steps.flatMap((step, index) =>
    typeof step.run === "string" ? [{ command: step.run, step, index }] : [],
  );
}
