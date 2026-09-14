import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateStructuredReference } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/resolve-structured-reference.mjs";

test("validates files, directories, JSON anchors, and malformed references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-reference-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  const target = join(specs, "target.json");
  const source = join(specs, "source.json");
  const sourceModule = join(root, "src", "source.mjs");
  const testsModule = join(root, "tests", "source.test.mjs");
  const assets = join(specs, "assets");
  await writeFile(target, JSON.stringify({ records: [{ id: "stable-id" }] }));
  await writeFile(source, "{}");
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await mkdir(assets);
  await writeFile(sourceModule, "export {};");
  await writeFile(testsModule, "export {};");
  const valid = (value) =>
    validateStructuredReference({ root, file: source, field: "path", value });
  await expect(valid("./target.json#id=stable-id")).resolves.toBeNull();
  await expect(valid("../src")).resolves.toBeNull();
  await expect(valid("./missing.json")).resolves.toBe("does not resolve to an available target");
  await expect(valid("./target")).resolves.toBe("does not resolve to an available target");
  await expect(valid("C:/outside.json")).resolves.toBe(
    "must be a nonempty repository-relative path, not a URI or absolute path",
  );
  await expect(valid("https://example.test/file.json")).resolves.toBe(
    "must be a nonempty repository-relative path, not a URI or absolute path",
  );
  await expect(valid("./target.json#id=missing")).resolves.toBe("has an unresolved JSON anchor");
  await expect(valid("./target.json#records")).resolves.toBeNull();
  await expect(valid("./target.json")).resolves.toBeNull();
  await expect(valid("./assets/")).resolves.toBeNull();
  await expect(valid("assets")).resolves.toBeNull();
  await expect(valid("./assets/#fragment")).resolves.toBeNull();
  await expect(valid("./source.json#records")).resolves.toBe("has an unresolved JSON anchor");
  await writeFile(join(specs, "invalid.json"), "not json");
  await expect(valid("./invalid.json#id=anything")).resolves.toBe("has an unresolved JSON anchor");
  await writeFile(join(specs, "scalar.json"), "7");
  await expect(valid("./scalar.json#id=anything")).resolves.toBe("has an unresolved JSON anchor");
  await writeFile(join(specs, "extensionless"), "file");
  await expect(valid("extensionless")).resolves.toBe("must identify a file with an extension");
  await expect(
    validateStructuredReference({ root, file: source, field: "implementation.source", value: "src/source.mjs" }),
  ).resolves.toBeNull();
  await expect(
    validateStructuredReference({ root, file: source, field: "verification.tests", value: "tests/source.test.mjs" }),
  ).resolves.toBeNull();
  await expect(valid(null)).resolves.toBe(
    "must be a nonempty repository-relative path, not a URI or absolute path",
  );
  await expect(valid(" ")).resolves.toBe(
    "must be a nonempty repository-relative path, not a URI or absolute path",
  );
  await expect(valid("#fragment")).resolves.toBe("must be a repository-relative path");
  await expect(valid("\\outside.json")).resolves.toBe("must be a repository-relative path");
  await expect(valid("/outside.json")).resolves.toBe("must be a repository-relative path");
  await expect(
    validateStructuredReference({
      root,
      file: source,
      field: "path",
      value: "../../outside.json",
      registered: true,
    }),
  ).resolves.toBeNull();
});
