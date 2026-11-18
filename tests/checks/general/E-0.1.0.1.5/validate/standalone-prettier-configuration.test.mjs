import { expect, test } from "@jest/globals";
import validateStandalonePrettierConfiguration from "../../../../../src/checks/general/E-0.1.0.1.5/validate/standalone-prettier-configuration.mjs";
test("delegates standalone configuration validation", async () => {
  await expect(
    validateStandalonePrettierConfiguration({ files: async () => ["src/index.mjs"] }),
  ).resolves.toEqual([]);
});
