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
        stat: async () => ({ isFile: () => true }),
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
      stat: async () => ({ isFile: () => false }),
    },
  );
  expect(errors.join("\n")).toContain("command name is invalid");
  expect(errors.join("\n")).toContain("stay under bin/");
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
      stat: async () => {
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
    { stat: async () => ({ isFile: () => true }) },
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
      { stat: async () => ({ isFile: () => true }) },
    );
    expect(errors.length).toBeGreaterThan(0);
  }
});

test("uses the default context and dependencies", async () => {
  await expect(validateApplicationEntrypoints()).resolves.toContain(
    "package.json must declare at least one runtime entrypoint through main or bin.",
  );
});
