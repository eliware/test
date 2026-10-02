import { expect, test } from "@jest/globals";
import { releaseTagGuard } from "../../../../src/checks/ghcr-published/release-version-tag.mjs";
import { validateNpmPublicationJob } from "../../../../src/checks/npm-published/E-0.1.140/validate-npm-publication-job.mjs";

function workflow({ runner = "ubuntu-latest", needs = "validate", publish = {} } = {}) {
  return {
    document: {
      jobs: {
        validate: { "runs-on": "ubuntu-latest", steps: [{ run: "npm ci" }, { run: "npm test" }] },
        publish: {
          "runs-on": runner,
          needs,
          steps: [{ run: releaseTagGuard }, { run: "npm publish", ...publish }],
        },
      },
    },
  };
}

test("requires an Ubuntu job with validation dependency and ordered release gates", () => {
  const valid = workflow();
  expect(validateNpmPublicationJob(valid, valid.document.jobs.publish)).toBe(true);
  const missingDependency = workflow({ needs: "other" });
  expect(
    validateNpmPublicationJob(missingDependency, missingDependency.document.jobs.publish),
  ).toBe(false);
  const wrongRunner = workflow({ runner: "windows-latest" });
  expect(validateNpmPublicationJob(wrongRunner, wrongRunner.document.jobs.publish)).toBe(false);
  const listDependency = workflow({ needs: ["validate"] });
  expect(validateNpmPublicationJob(listDependency, listDependency.document.jobs.publish)).toBe(
    true,
  );
  const absentDependency = workflow();
  delete absentDependency.document.jobs.publish.needs;
  expect(validateNpmPublicationJob(absentDependency, absentDependency.document.jobs.publish)).toBe(
    false,
  );
});

test("rejects publish steps before the release guard or with conditional tolerance", () => {
  const reversed = workflow();
  reversed.document.jobs.publish.steps.reverse();
  expect(validateNpmPublicationJob(reversed, reversed.document.jobs.publish)).toBe(false);
  for (const publish of [{ if: "always()" }, { "continue-on-error": true }]) {
    const conditional = workflow({ publish });
    expect(validateNpmPublicationJob(conditional, conditional.document.jobs.publish)).toBe(false);
  }
});

test("rejects multiline scripts that append commands to npm publish", () => {
  for (const run of [
    "npm publish --provenance\necho unexpected command",
    `npm publish --provenance && echo unexpected command`,
  ]) {
    const fixture = workflow();
    fixture.document.jobs.publish.steps[1].run = run;
    expect(validateNpmPublicationJob(fixture, fixture.document.jobs.publish)).toBe(false);
  }
});

test("requires the release tag guard to occupy its entire run step", () => {
  const fixture = workflow();
  fixture.document.jobs.publish.steps[0].run = `${releaseTagGuard}\necho bypass`;
  expect(validateNpmPublicationJob(fixture, fixture.document.jobs.publish)).toBe(false);
});
