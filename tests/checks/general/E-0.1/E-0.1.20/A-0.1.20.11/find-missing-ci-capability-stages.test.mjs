import { expect, test } from "@jest/globals";
import { findMissingCiCapabilityStages } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/A-0.1.20.11/find-missing-ci-capability-stages.mjs";

const workflow = (steps, runsOn = "ubuntu-latest") => ({
  document: {
    jobs: {
      validate: {
        "runs-on": runsOn,
        steps: steps.map((command) => ({ run: command })),
      },
    },
  },
});

test("requires declared stages in the compliant Ubuntu validation job", () => {
  expect(
    findMissingCiCapabilityStages(
      ["typecheck", "build"],
      [workflow(["npm ci", "npm test", "echo npm run typecheck"])],
    ),
  ).toEqual(["typecheck", "build"]);
  expect(
    findMissingCiCapabilityStages(
      ["typecheck", "build"],
      [workflow(["npm ci", "npm test", "npm run typecheck", "npm run build"])],
    ),
  ).toEqual([]);
});

test("ignores declared stage text in unrelated jobs and non-Ubuntu jobs", () => {
  const validation = workflow(["npm ci", "npm test"]);
  const unrelated = {
    document: {
      jobs: {
        quality: {
          "runs-on": "ubuntu-latest",
          steps: [{ run: "npm run build" }],
        },
      },
    },
  };
  const windowsValidation = workflow(["npm ci", "npm test", "npm run build"], "windows-latest");
  expect(
    findMissingCiCapabilityStages(["build"], [validation, unrelated, windowsValidation]),
  ).toEqual(["build"]);
});

test("requires an explicit Ubuntu runner and npm test after npm ci", () => {
  const missingRunner = {
    document: {
      jobs: {
        validate: {
          steps: [{ run: "npm ci" }, { run: "npm test" }, { run: "npm run build" }],
        },
      },
    },
  };

  expect(findMissingCiCapabilityStages(["build"], [missingRunner, workflow(["npm ci"])])).toEqual([
    "build",
  ]);
});
