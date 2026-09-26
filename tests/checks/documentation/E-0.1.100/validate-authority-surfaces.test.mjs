import { expect, test } from "@jest/globals";
import { validateAuthoritySurfaces } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-surfaces.mjs";

test("delegates authority surface validation", async () => {
  await expect(validateAuthoritySurfaces("C:/missing-test-root", [])).resolves.toBeNull();
});
