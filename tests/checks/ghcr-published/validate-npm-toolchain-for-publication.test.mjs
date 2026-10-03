import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../test-fixtures/ghcr-workflow.mjs";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
} from "../../../src/checks/general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";
import { run as checkGhcrPublicationWorkflow } from "../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.2.mjs";
import { validateNpmToolchainForPublication } from "../../../src/checks/ghcr-published/validate-npm-toolchain-for-publication.mjs";

test("leaves GHCR publishers without npm commands unchanged", () => {
  expect(
    validateNpmToolchainForPublication("publish", { steps: [{ run: "docker push image" }] }),
  ).toBeNull();
  expect(validateNpmToolchainForPublication("publish", {})).toBeNull();
});

test("requires the npm 12 toolchain only when a GHCR publisher invokes npm", () => {
  const job = { steps: [{ run: "npm run build" }] };
  expect(validateNpmToolchainForPublication("publish", job)).toContain(
    "before its first npm command",
  );
  job.steps = [
    { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
    { run: npm12InstallCommand },
    { run: npm12VersionCheckCommand },
    { run: "npm run build" },
  ];
  expect(validateNpmToolchainForPublication("publish", job)).toBeNull();
});

test("requires setup verification when npm installation is the only npm command", () => {
  expect(
    validateNpmToolchainForPublication("publish", {
      steps: [
        { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
        { run: npm12InstallCommand },
      ],
    }),
  ).toContain("before its first npm command");
});

test("integrates npm 12 requirements into GHCR workflow validation", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  const npmCommand = "      - run: npm run build\n";
  const run = () =>
    checkGhcrPublicationWorkflow({
      root,
      packageJson: { name: "@eliware/example", version: "1.2.3" },
    });
  await writeFile(
    publicationPath,
    content.replace("      - id: push\n", `${npmCommand}      - id: push\n`),
  );
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  const setup = `      - uses: actions/setup-node@v7\n        with:\n          node-version: 26\n      - run: ${npm12InstallCommand}\n      - run: >-\n          ${npm12VersionCheckCommand}\n`;
  await writeFile(
    publicationPath,
    content.replace("      - id: push\n", `${setup}${npmCommand}      - id: push\n`),
  );
  await expect(run()).resolves.toMatchObject({ status: "pass" });
});
