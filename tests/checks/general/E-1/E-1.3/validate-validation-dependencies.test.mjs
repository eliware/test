import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.3.mjs";

test("rejects direct validation-tool dependencies", async () => {
  for (const dependency of ["oxlint", "@jest/globals", "jest", "prettier", "@oxlint/cli"]) {
    await expect(run({ packageJson: { devDependencies: { [dependency]: "1.0.0" } } })).resolves.toEqual(
      expect.objectContaining({ status: "fail" }),
    );
  }
});
