import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/web/E-1.50/E-1.50.1.mjs";

test("requires a clean public asset root", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-"));
  await mkdir(join(root, "public"));
  expect((await run({ root, packageJson: {} })).status).toBe("pass");
  await mkdir(join(root, "public", "dist"));
  expect((await run({ root, packageJson: {} })).status).toBe("fail");
});

test("supports configured asset roots and exclusions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-"));
  await mkdir(join(root, "assets"));
  expect(
    (await run({ root, packageJson: { eliware: { webRoot: " assets ", webAssetExcludes: ["tmp"] } } })).status,
  ).toBe("pass");
  await mkdir(join(root, "assets", "tmp-cache"));
  expect(
    (await run({ root, packageJson: { eliware: { webRoot: "assets", webAssetExcludes: ["tmp"] } } })).status,
  ).toBe("fail");
});

test("rejects invalid exclusions and missing asset roots", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-web-"));
  await expect(run({ root, packageJson: { eliware: { webAssetExcludes: "dist" } } })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "eliware.webAssetExcludes must be a string array when provided.",
    }),
  );
  await expect(run({ root, packageJson: { eliware: { webAssetExcludes: [""] } } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await expect(run({ root: `${root}-missing`, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "public/ is required as the web public asset root.",
    }),
  );
});
