import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const realpath = jest.fn();
const stat = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ realpath, stat }));

const { resolveFocusedFormatterPaths } =
  await import("../../../../../src/validation/stages/format/resolve/focused-formatter-paths.mjs");

const root = join("C:/", "repo");

beforeEach(() => {
  realpath.mockReset().mockImplementation(async (path) => path);
  stat.mockReset().mockResolvedValue({ isFile: () => true });
});

test("accepts existing maintained files and rejects invalid focused scopes", async () => {
  await expect(resolveFocusedFormatterPaths(root, { paths: ["src/example.mjs"] })).resolves.toEqual(
    ["src/example.mjs"],
  );
  await expect(
    resolveFocusedFormatterPaths(root, { paths: ["src\\example.mjs"] }),
  ).resolves.toEqual(["src/example.mjs"]);
  for (const focusedScope of [
    null,
    {},
    { paths: null },
    { paths: [] },
    ...["", "src/../package.json", "src/./example.mjs", "docs/example.md", 7].map((path) => ({
      paths: [path],
    })),
  ]) {
    await expect(resolveFocusedFormatterPaths(root, focusedScope)).resolves.toBeNull();
  }
  realpath.mockImplementation(async (path) => {
    if (path.endsWith("missing.mjs")) throw new Error("missing");
    return path;
  });
  await expect(
    resolveFocusedFormatterPaths(root, { paths: ["src/missing.mjs"] }),
  ).resolves.toBeNull();
});

test("rejects directories and symlinks that resolve outside the repository", async () => {
  stat.mockResolvedValueOnce({ isFile: () => false });
  realpath.mockImplementation(async (path) =>
    path.endsWith(join("src", "linked", "escape.mjs"))
      ? join("C:/", "outside", "escape.mjs")
      : path,
  );

  await expect(
    resolveFocusedFormatterPaths(root, { paths: ["src/directory"] }),
  ).resolves.toBeNull();
  await expect(
    resolveFocusedFormatterPaths(root, { paths: ["src/linked/escape.mjs"] }),
  ).resolves.toBeNull();
});

test("accepts existing focused paths with case-variant source directory names", async () => {
  await expect(
    resolveFocusedFormatterPaths(root, {
      paths: ["Tests/example.test.mjs", "Src/example.mjs"],
    }),
  ).resolves.toEqual(["Tests/example.test.mjs", "Src/example.mjs"]);
});
