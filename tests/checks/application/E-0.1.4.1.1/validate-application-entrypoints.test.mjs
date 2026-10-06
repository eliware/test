import { expect, test } from "@jest/globals";
import { validateApplicationEntrypoints } from "../../../../src/checks/application/E-0.1.4.1.1/validate-application-entrypoints.mjs";

test("accepts string and object entrypoints that resolve to files", async () => {
  const packageJson = {
    main: "bin/main.mjs",
    bin: { app: "bin/app.mjs" },
    scripts: { start: "node bin/main.mjs" },
  };
  await expect(
    validateApplicationEntrypoints(
      { root: "repo", packageJson },
      {
        lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }),
      },
    ),
  ).resolves.toEqual([]);
});

test("rejects no entrypoint, malformed bin metadata, bad paths, and directories", async () => {
  const packageJson = {
    bin: { "bad name": "../out.mjs", good: "bin/dir" },
    scripts: { start: "" },
  };
  const errors = await validateApplicationEntrypoints(
    { root: "repo", packageJson },
    {
      lstat: async () => ({ isFile: () => false, isSymbolicLink: () => false }),
    },
  );
  expect(errors.join("\n")).toContain("command name is invalid");
  expect(errors.join("\n")).toContain("canonical path under bin/");
  expect(errors.join("\n")).toContain("existing file");
  expect(errors.join("\n")).toContain("standalone token");
});

test("reports stat errors and rejects absolute paths", async () => {
  const errors = await validateApplicationEntrypoints(
    {
      root: "repo",
      packageJson: {
        main: "C:\\outside.mjs",
        bin: "bin/missing.mjs",
      },
    },
    {
      lstat: async () => {
        throw new Error("missing");
      },
    },
  );
  expect(errors.join("\n")).toContain("repository-relative");
  expect(errors.join("\n")).toContain("does not exist");
});

test("rejects invalid main and bin target types beside valid targets", async () => {
  const errors = await validateApplicationEntrypoints(
    {
      root: "repo",
      packageJson: { main: 42, bin: { cli: "bin/cli.mjs", invalid: null } },
    },
    { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }) },
  );
  expect(errors).toContain("package.json main must be a nonempty path string.");
  expect(errors).toContain("package.json bin target for invalid must be a nonempty path string.");
});

test("rejects empty entrypoint paths and invalid bin shapes", async () => {
  for (const packageJson of [
    { main: " " },
    { bin: " " },
    { bin: 7 },
    { main: "bin/main.mjs", bin: [] },
  ]) {
    const errors = await validateApplicationEntrypoints(
      { root: "repo", packageJson },
      { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }) },
    );
    expect(errors.length).toBeGreaterThan(0);
  }
});

test("rejects normalized traversal paths and entrypoint symlinks", async () => {
  const paths = await validateApplicationEntrypoints(
    { root: "repo", packageJson: { main: "bin/../bin/main.mjs" } },
    { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }) },
  );
  expect(paths).toContain(
    "Entrypoint target must use a canonical path under bin/: bin/../bin/main.mjs.",
  );

  const links = await validateApplicationEntrypoints(
    { root: "repo", packageJson: { main: "bin/main.mjs" } },
    { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => true }) },
  );
  expect(links).toContain("Entrypoint target path must not contain a symlink: bin/main.mjs.");
});

test("rejects a parent symlink that can escape the checkout", async () => {
  const errors = await validateApplicationEntrypoints(
    { root: "repo", packageJson: { main: "bin/link/main.mjs" } },
    {
      lstat: async (path) => ({
        isFile: () => path.endsWith("main.mjs"),
        isSymbolicLink: () => path.replaceAll("\\", "/").endsWith("bin/link"),
      }),
    },
  );
  expect(errors).toContain("Entrypoint target path must not contain a symlink: bin/link/main.mjs.");
});

test("uses the default context and dependencies", async () => {
  await expect(validateApplicationEntrypoints()).resolves.toContain(
    "package.json must declare at least one runtime entrypoint through main or bin.",
  );
});
