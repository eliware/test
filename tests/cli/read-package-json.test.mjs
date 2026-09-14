import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readPackageJson } from "../../src/cli/read-package-json.mjs";

test("reads package metadata with Eliware configuration", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-package-"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "@eliware/example", eliware: { apply: ["general"] } }),
  );
  await expect(readPackageJson(root)).resolves.toEqual(
    expect.objectContaining({ name: "@eliware/example" }),
  );
});

test("rejects package metadata without an eliware object", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-package-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "@eliware/example" }));
  await expect(readPackageJson(root)).rejects.toThrow("package.json.eliware is required");
});
