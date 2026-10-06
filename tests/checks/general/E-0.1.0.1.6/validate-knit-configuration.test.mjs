import { expect, test } from "@jest/globals";
import { validateKnitConfiguration } from "../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration.mjs";

test("validates nested Knit command lists", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml", ".knit/check.mjs"],
      readText: async () =>
        "jobs:\n  validate:\n    commands:\n      - git pull --ff-only origin main\n      - npm ci\n      - npm test\n",
    }),
  ).resolves.toEqual([]);
});

test("rejects commands that publish images or use scripts outside .knit", async () => {
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      "commands: [git pull --ff-only origin main, npm ci, npm test, docker push $GHCR_IMAGE, node scripts/run.mjs]",
  });
  expect(errors.join(" ")).toContain("must not publish npm packages or GHCR images");
  expect(errors.join(" ")).toContain("must keep secondary scripts under .knit/");
});
