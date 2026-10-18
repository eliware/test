import { expect, jest, test } from "@jest/globals";
import { validateRunbookIndexCheck } from "../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/index-check.mjs";

test("requires and reads the runbook index", async () => {
  const readText = jest.fn(async () => "# Runbooks\n\n- [Deploy](deploy.yaml)");
  const inventory = { readText };

  await expect(validateRunbookIndexCheck([], inventory, [])).resolves.toEqual([
    "runbooks/README.md is required.",
  ]);
  await expect(
    validateRunbookIndexCheck(["runbooks/README.md"], inventory, ["runbooks/deploy.yaml"]),
  ).resolves.toEqual([]);
  expect(readText).toHaveBeenCalledWith("runbooks/README.md");
});

test("reports index read failures", async () => {
  await expect(
    validateRunbookIndexCheck(
      ["runbooks/README.md"],
      {
        readText: async () => {
          throw new Error("blocked");
        },
      },
      [],
    ),
  ).resolves.toEqual(["runbooks/README.md could not be read: blocked"]);
});
