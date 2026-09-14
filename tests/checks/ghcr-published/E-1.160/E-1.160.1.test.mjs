import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.1.mjs";

test("requires the Eliware GHCR image name", async () => {
  const { root } = await createGhcrFixture();
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
  await expect(run({ root, packageJson: { name: "@eliware/other" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await expect(run({ root, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository", packageJson: { name: "@eliware/example" } })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});
