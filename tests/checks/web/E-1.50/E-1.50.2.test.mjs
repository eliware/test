import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/web/E-1.50/E-1.50.2.mjs";

test("requires acceptance documentation when browser checks are declared", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-web-acceptance-"));
  const packageJson = { scripts: { e2e: "playwright test" } };
  await expect(run({ root, packageJson })).resolves.toMatchObject({ status: "fail" });
  await writeFile(join(root, "README.md"), "Browser validation is required.");
  await expect(run({ root, packageJson })).resolves.toMatchObject({ status: "pass" });
});

test("does not invent acceptance requirements for projects without browser signals", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-web-no-acceptance-"));
  await expect(run({ root, packageJson: { scripts: { build: "vite" } } })).resolves.toMatchObject({
    status: "pass",
  });
});

test("reports individual missing acceptance topics and supports dependency signals", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-web-acceptance-"));
  await writeFile(join(root, "README.md"), "Browser checks are documented.");
  await expect(run({ root, packageJson: { dependencies: { puppeteer: "1" } } })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Web acceptance checks are not documented: validation.",
    }),
  );
});
