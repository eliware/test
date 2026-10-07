import { expect, test } from "@jest/globals";
import { join, win32 } from "node:path";
import { normalizeRepositoryInventoryRecords } from "../../../../src/validation/shared/repository/normalize-repository-inventory-records.mjs";

test("normalizes absolute records inside the repository and drops outside records", () => {
  const root = process.cwd();
  expect(
    normalizeRepositoryInventoryRecords(root, [
      { path: join(root, "docs", "guide.md"), type: "file" },
      { path: join(root, "..", "outside.md"), type: "file" },
    ]),
  ).toEqual([{ path: "docs/guide.md", type: "file" }]);
});

test("normalizes relative record paths without changing metadata", () => {
  expect(
    normalizeRepositoryInventoryRecords("/repo", [
      { path: "docs/guide.md", type: "file", depth: 2 },
    ]),
  ).toEqual([{ path: "docs/guide.md", type: "file", depth: 2 }]);
});

test("rejects Windows absolute records for POSIX repository roots", () => {
  expect(
    normalizeRepositoryInventoryRecords("/repo", [
      { path: "C:\\outside\\file.mjs", type: "file" },
      { path: "\\\\server\\share\\file.mjs", type: "file" },
      { path: "src/file.mjs", type: "file" },
    ]),
  ).toEqual([{ path: "src/file.mjs", type: "file" }]);
});

test("normalizes Windows device-namespace repository roots with Windows path rules", () => {
  expect(
    normalizeRepositoryInventoryRecords("\\\\?\\C:\\repo", [
      { path: "\\\\?\\C:\\repo\\src\\file.mjs", type: "file" },
      { path: "C:\\repo\\src\\ordinary.mjs", type: "file" },
    ]),
  ).toEqual([
    { path: "src/file.mjs", type: "file" },
    { path: "src/ordinary.mjs", type: "file" },
  ]);
  expect(
    normalizeRepositoryInventoryRecords("C:\\repo", [
      { path: "\\\\?\\C:\\repo\\src\\device.mjs", type: "file" },
    ]),
  ).toEqual([{ path: "src/device.mjs", type: "file" }]);
});

test("normalizes Windows DOS device-namespace repository roots with Windows path rules", () => {
  const root = String.raw`\\.\C:\repo`;
  const file = String.raw`\\.\C:\repo\src\file.mjs`;
  expect(normalizeRepositoryInventoryRecords(root, [{ path: file, type: "file" }])).toEqual([
    { path: "src/file.mjs", type: "file" },
  ]);
});

test("normalizes device and ordinary UNC records against the same repository root", () => {
  const deviceRoot = String.raw`\\?\UNC\server\share\repo`;
  const ordinaryRoot = String.raw`\\server\share\repo`;
  const ordinaryRecord = String.raw`\\server\share\repo\src\ordinary.mjs`;
  const deviceRecord = String.raw`\\?\UNC\server\share\repo\src\device.mjs`;

  expect(
    normalizeRepositoryInventoryRecords(deviceRoot, [{ path: ordinaryRecord, type: "file" }]),
  ).toEqual([{ path: "src/ordinary.mjs", type: "file" }]);
  expect(
    normalizeRepositoryInventoryRecords(ordinaryRoot, [{ path: deviceRecord, type: "file" }]),
  ).toEqual([{ path: "src/device.mjs", type: "file" }]);
});

test("normalizes DOS UNC and preserves extended volume namespace records", () => {
  const dosRoot = String.raw`\\.\UNC\server\share\repo`;
  const dosRecord = String.raw`\\.\UNC\server\share\repo\src\file.mjs`;
  const volumeRoot = String.raw`\\?\Volume{12345678-1234-1234-1234-123456789abc}\repo`;
  const volumeRecord = String.raw`\\?\Volume{12345678-1234-1234-1234-123456789abc}\repo\src\volume.mjs`;

  expect(normalizeRepositoryInventoryRecords(dosRoot, [{ path: dosRecord, type: "file" }])).toEqual(
    [{ path: "src/file.mjs", type: "file" }],
  );
  expect(
    normalizeRepositoryInventoryRecords(volumeRoot, [{ path: volumeRecord, type: "file" }]),
  ).toEqual([{ path: "src/volume.mjs", type: "file" }]);
});

test("drops null and malformed inventory records", () => {
  expect(normalizeRepositoryInventoryRecords("/repo", [null, undefined, {}, { path: 7 }])).toEqual(
    [],
  );
});

test("rejects POSIX-rooted records for Windows repositories", () => {
  expect(
    normalizeRepositoryInventoryRecords("C:\\repo", [
      { path: "/repo/file.mjs", type: "file" },
      { path: "//server/share/repo/file.mjs", type: "file" },
      { path: "C:outside\\file.mjs", type: "file" },
      { path: win32.join("C:\\repo", "src", "file.mjs"), type: "file" },
    ]),
  ).toEqual([{ path: "src/file.mjs", type: "file" }]);
});
