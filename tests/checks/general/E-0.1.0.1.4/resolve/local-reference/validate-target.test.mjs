import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import validateMarkdownLocalTarget from "../../../../../../src/checks/general/E-0.1.0.1.4/resolve/local-reference/validate-target.mjs";
const root = resolve("repo");
const file = { isFile: () => true, isDirectory: () => false };
const inspect = (dependencies = {}, fragment = "", target = resolve(root, "target.md")) =>
  validateMarkdownLocalTarget(root, target, fragment, {
    realpath: async (path) => path,
    stat: async () => file,
    read: async () => "# Target\n",
    ...dependencies,
  });
test("accepts a target inside the repository", async () => {
  await expect(inspect()).resolves.toBeNull();
  const repository = process.cwd();
  await expect(
    validateMarkdownLocalTarget(repository, resolve(repository, "README.md"), ""),
  ).resolves.toBeNull();
});
test("rejects a target outside the repository", async () => {
  await expect(
    inspect({ realpath: async (path) => (path === root ? root : resolve(root, "../outside")) }),
  ).resolves.toBe("outside");
});
test("checks Markdown fragments", async () => {
  await expect(inspect({}, "target")).resolves.toBeNull();
  await expect(inspect({ read: async () => "# Other\n" }, "missing")).resolves.toBe("fragment");
});
test("requires other targets to be files or directories", async () => {
  await expect(
    inspect(
      { stat: async () => ({ isFile: () => false, isDirectory: () => false }) },
      "part",
      resolve(root, "target.txt"),
    ),
  ).resolves.toBe("missing");
});
test("reports filesystem errors to its caller", async () => {
  await expect(inspect({ stat: async () => Promise.reject(new Error("missing")) })).rejects.toThrow(
    "missing",
  );
});
