import { expect, jest, test } from "@jest/globals";
import { createProfileValidationStageRunners } from "../../../../src/validation/stages/registry/create-profile-validation-stage-runners.mjs";

test("uses default stage dependencies", () => {
  expect(createProfileValidationStageRunners()).toHaveProperty("typecheck");
});

test("runs pack only for the published profile and maps failures", async () => {
  const runners = createProfileValidationStageRunners({
    validatePack: async () => "pack failure",
  });
  await expect(runners.pack({ packageJson: { eliware: { apply: [] } } })).resolves.toMatchObject({
    code: 0,
  });
  await expect(
    runners.pack({ packageJson: { eliware: { apply: ["npm-published"] } } }),
  ).resolves.toMatchObject({ code: 9 });
  const failed = createProfileValidationStageRunners({
    validatePack: async () => {
      throw new Error("pack spawn failed");
    },
  });
  await expect(
    failed.pack({ packageJson: { eliware: { apply: ["npm-published"] } } }),
  ).resolves.toMatchObject({ code: 9 });
});

test("caches outdated dependency output and maps clean or failed results", async () => {
  const clean = createProfileValidationStageRunners({
    runOutdated: async () => ({ dependencies: {}, outdated: [] }),
  });
  const context = { root: ".", env: {} };
  await expect(clean.outdated(context)).resolves.toMatchObject({ code: 0 });
  expect(context.outdatedDependencies).toEqual({});
  const failed = createProfileValidationStageRunners({
    runOutdated: jest.fn(async () => {
      throw new Error("registry failed");
    }),
  });
  await expect(failed.outdated({ root: "." })).resolves.toMatchObject({ code: 8 });
});

test("runs typecheck and build only for valid profile scripts", async () => {
  const runScript = jest.fn(async () => ({ code: 1, stderr: "failed" }));
  const runners = createProfileValidationStageRunners({ runScript });
  const library = {
    root: ".",
    env: {},
    packageJson: {
      eliware: { apply: ["library"] },
      scripts: { typecheck: "tsc --noEmit" },
      devDependencies: { typescript: "*" },
    },
  };
  const web = {
    ...library,
    env: { npm_config_ignore_scripts: "false", TASK_SETTING: "keep" },
    packageJson: {
      eliware: { apply: ["web"] },
      scripts: { build: "vite build" },
      devDependencies: { vite: "*" },
    },
  };
  await expect(runners.typecheck(library)).resolves.toMatchObject({ code: 10 });
  await expect(runners.build(web)).resolves.toMatchObject({ code: 11 });
  runScript.mockResolvedValue({ code: 0 });
  await expect(runners.typecheck({ ...library, env: undefined })).resolves.toMatchObject({
    code: 0,
  });
  expect(runScript.mock.calls.map(([, name]) => name)).toEqual(["typecheck", "build", "typecheck"]);
  expect(runScript.mock.calls[0][4]).toEqual({});
  expect(runScript.mock.calls[1][4]).toEqual({
    npm_config_ignore_scripts: "true",
    TASK_SETTING: "keep",
  });
  const notApplicable = await runners.typecheck({
    packageJson: { eliware: { apply: ["application"] } },
  });
  expect(notApplicable.status).toBe("pass");
  const startup = createProfileValidationStageRunners({
    runScript: async () => {
      throw new Error("typecheck spawn failed");
    },
  });
  await expect(startup.typecheck(library)).resolves.toMatchObject({ code: 10 });
});

test("reports missing and unsafe profile scripts as configuration failures", async () => {
  const runScript = jest.fn(async () => ({ code: 0 }));
  const runners = createProfileValidationStageRunners({ runScript });
  await expect(
    runners.typecheck({ packageJson: { eliware: { apply: ["library"] } } }),
  ).resolves.toMatchObject({ code: 1 });
  await expect(
    runners.build({
      packageJson: {
        eliware: { apply: ["web"] },
        scripts: { build: "npm run unsafe" },
      },
    }),
  ).resolves.toMatchObject({ code: 1 });
  await expect(
    runners.typecheck({
      packageJson: {
        eliware: { apply: ["library"] },
        scripts: { typecheck: "tsc --noEmit" },
      },
    }),
  ).resolves.toMatchObject({ code: 1 });
  expect(runScript).not.toHaveBeenCalled();
});
