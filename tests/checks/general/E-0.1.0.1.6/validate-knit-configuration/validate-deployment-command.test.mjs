import { expect, test } from "@jest/globals";
import { validateDeploymentCommand } from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/validate-deployment-command.mjs";

const label = ".knit/deploy.yaml commands field 1";

test("rejects package and image publication commands", () => {
  expect(validateDeploymentCommand("npm publish", label, 3, {})).toEqual([
    `${label} must not publish npm packages or GHCR images.`,
    `${label} command 4 must call a declared package script with npm run <name>.`,
  ]);
  expect(
    validateDeploymentCommand("docker push ghcr.io/eliware/app:latest", label, 3, {}),
  ).toContain(`${label} must not publish npm packages or GHCR images.`);
});

test("requires extra commands to call declared package scripts", () => {
  expect(
    validateDeploymentCommand("npm run validate", label, 3, { scripts: { validate: "check" } }),
  ).toEqual([]);
  expect(validateDeploymentCommand("npm run missing", label, 3, { scripts: {} })).toEqual([
    `${label} command 4 must name a script declared in package.json.scripts.`,
  ]);
  expect(validateDeploymentCommand('bash -c "node ./config"', label, 3, {})).toEqual([
    `${label} command 4 must call a declared package script with npm run <name>.`,
  ]);
});
