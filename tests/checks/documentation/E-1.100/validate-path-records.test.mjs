import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePathRecords } from "../../../../src/checks/documentation/E-1.100/validate-path-records.mjs";

test("validates authority path record collections", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-records-"));
  const file = join(root, "authority.json");
  await writeFile(join(root, "target.json"), "{}");
  await expect(validatePathRecords({ root, file, records: null, label: "records" })).resolves.toBe("records must be an array.");
  await expect(validatePathRecords({ root, file, records: [null], label: "records" })).resolves.toBe("records[0] must contain a path.");
  await expect(validatePathRecords({ root, file, records: [{ path: "./target.json" }], label: "records" })).resolves.toBeNull();
  await expect(validatePathRecords({ root, file, records: [{ path: "./missing.json" }], label: "records" })).resolves.toBe("records[0] does not resolve: ./missing.json.");
});
