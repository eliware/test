import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../test-fixtures/ghcr-workflow.mjs";
import { npmLatestInstallCommand } from "../../../src/checks/general/E-0.1/E-0.1.24/validate-npm-install-workflow-setup.mjs";
import { run as checkGhcrPublicationWorkflow } from "../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.2.mjs";
import { validateNpmToolchainForPublication } from "../../../src/checks/ghcr-published/validate-npm-toolchain-for-publication.mjs";

test("leaves GHCR publishers without npm commands unchanged", () => {
  expect(
    validateNpmToolchainForPublication("publish", { steps: [{ run: "docker push image" }] }),
  ).toBeNull();
  expect(validateNpmToolchainForPublication("publish", {})).toBeNull();
});

test("requires npm latest setup only when a GHCR publisher invokes npm", () => {
  const job = { steps: [{ run: "npm run build" }] };
  expect(validateNpmToolchainForPublication("publish", job)).toContain(
    "before its first npm operation",
  );
  job.steps = [
    { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
    { run: npmLatestInstallCommand },
    { run: "npm run build" },
  ];
  expect(validateNpmToolchainForPublication("publish", job)).toBeNull();
});

test("allows npm installation when it is the only npm command", () => {
  expect(
    validateNpmToolchainForPublication("publish", {
      steps: [
        { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
        { run: npmLatestInstallCommand },
      ],
    }),
  ).toBeNull();
});

test("integrates npm latest setup into GHCR workflow validation", async () => {
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
  const setup = `      - uses: actions/setup-node@v7\n        with:\n          node-version: 26\n      - run: ${npmLatestInstallCommand}\n`;
  await writeFile(
    publicationPath,
    content.replace("      - id: push\n", `${setup}${npmCommand}      - id: push\n`),
  );
  await expect(run()).resolves.toMatchObject({ status: "pass" });
});
