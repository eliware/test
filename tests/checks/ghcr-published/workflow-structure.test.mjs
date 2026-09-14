import { expect, test } from "@jest/globals";
import { jobs, steps, stepText, stepsForWorkflow, workflowText } from "../../../src/checks/ghcr-published/workflow-structure.mjs";

test("extracts workflow jobs, steps, and text", () => {
  const workflow = { content: "content", document: { jobs: { ci: { steps: [{ run: "npm test" }] } } } };
  expect(jobs(workflow)).toHaveLength(1);
  expect(steps(jobs(workflow)[0].job)).toHaveLength(1);
  expect(stepText({ run: "npm test" })).toBe("npm test");
  expect(stepsForWorkflow(workflow)).toHaveLength(1);
  expect(workflowText(workflow)).toContain("npm test");
  expect(steps()).toEqual([]);
});

test("handles alternate workflow shapes", () => {
  const alternate = {
    content: "runs-on: ubuntu-24.04",
    document: {
      true: { push: { tags: ["other"] } },
      jobs: {
        publish: {
          runsOn: "ubuntu-latest",
          permissions: { packages: "write" },
          steps: [
            { uses: "docker/build-push-action@v6", with: { tags: "x" } },
            { with: { subjectName: "name", subjectDigest: "sha256:x" } },
            { run: "npm publish" },
          ],
        },
      },
    },
  };
  expect(stepText({ run: 7, uses: "action", with: { tags: "tag", subjectName: "n", subjectDigest: "d" } })).toBe("action tag n d");
  expect(stepsForWorkflow(alternate)).toHaveLength(3);
  expect(workflowText(alternate)).toContain("docker/build-push-action");
});
