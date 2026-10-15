import { expect, test } from "@jest/globals";
import {
  hasCanonicalReleaseTagFilter,
  hasCanonicalReleaseTagGuard,
} from "../../../../src/checks/shared/publish-workflow/validate-release-tag-guard.mjs";
import { packageVersion } from "../../../helpers/project-version.mjs";

const command = `node -e "const version=require('./package.json').version;if(!/^(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)$/.test(version)||process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"`;
const workflowCommand = `node -e "const version=require('./package.json').version;if(process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"`;
const workflow = { on: { push: { tags: ["v[0-9]*.[0-9]*.[0-9]*"] } } };
const steps = [{ uses: "actions/checkout@v7" }, { run: command }, { run: "publish" }];

test("accepts the canonical release tag guard before publication", () => {
  expect(hasCanonicalReleaseTagGuard(workflow, steps, packageVersion, 2)).toBe(true);
  expect(hasCanonicalReleaseTagFilter(workflow)).toBe(true);
});

test("accepts the golden workflow release tag guard", () => {
  expect(
    hasCanonicalReleaseTagGuard(
      workflow,
      [steps[0], { run: workflowCommand }, steps[2]],
      packageVersion,
      2,
    ),
  ).toBe(true);
});

test("rejects missing, bypassed, misplaced, and noncanonical release guards", () => {
  expect(hasCanonicalReleaseTagGuard(workflow, [steps[0], steps[2]], packageVersion, 1)).toBe(
    false,
  );
  expect(
    hasCanonicalReleaseTagGuard(
      workflow,
      [steps[0], { ...steps[1], if: "false" }, steps[2]],
      packageVersion,
      2,
    ),
  ).toBe(false);
  expect(hasCanonicalReleaseTagGuard(workflow, steps, `${packageVersion}-beta`, 2)).toBe(false);
  expect(hasCanonicalReleaseTagGuard(workflow, steps, `0${packageVersion}`, 2)).toBe(false);
  expect(
    hasCanonicalReleaseTagGuard(
      { on: { push: { tags: ["v[0-9]*.[0-9]*.[0-9]*-*"] } } },
      steps,
      packageVersion,
      2,
    ),
  ).toBe(false);
  expect(hasCanonicalReleaseTagFilter({ on: { push: { tags: ["main"] } } })).toBe(false);
});
