import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanSourceDependencyFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.20/scan-source-dependency-files.mjs";

test("parses source files and collects dependency references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-dependency-scan-"));
  try {
    await mkdir(join(root, "src"));
    await writeFile(
      join(root, "src", "module.mjs"),
      "import dependency from 'dep'; export { dependency };",
    );
    const referenced = new Set();

    await scanSourceDependencyFiles(root, ["src/module.mjs"], ["dep"], referenced, {
      value: false,
    });

    expect(referenced.has("dep")).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("counts declared package binaries spawned from validation scripts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-binary-scan-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, ".knit", "custom-check.mjs"),
      `
        import { spawn } from "node:child_process";
        const executable = new URL(
          \`../node_modules/.bin/vyops\${process.platform === "win32" ? ".cmd" : ""}\`,
          import.meta.url,
        );
        spawn(executable, ["preflight", "config.boot"]);
      `,
    );
    const referenced = new Set();

    await scanSourceDependencyFiles(
      root,
      [".knit/custom-check.mjs"],
      ["@eliware/vyops"],
      referenced,
      { value: false },
      null,
      new Map([["vyops", "@eliware/vyops"]]),
    );

    expect(referenced.has("@eliware/vyops")).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not count a subprocess call that invokes an unrelated executable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-binary-scan-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, ".knit", "custom-check.mjs"),
      `
        import * as childProcess from "node:child_process";
        const executable = "other-tool";
        childProcess.spawn(executable, []);
        getRunner()();
      `,
    );
    const referenced = new Set();

    await scanSourceDependencyFiles(
      root,
      [".knit/custom-check.mjs"],
      ["@eliware/vyops"],
      referenced,
      { value: false },
      null,
      new Map([["vyops", "@eliware/vyops"]]),
    );

    expect(referenced.has("@eliware/vyops")).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses an injected AST parser and skips non-source files", async () => {
  const parseAst = jest.fn(async () => ({ type: "File", program: { body: [] } }));
  await expect(
    scanSourceDependencyFiles(
      "/repo",
      ["README.md", "src/module.mjs", "src/module.ts"],
      [],
      new Set(),
      { value: false },
      parseAst,
    ),
  ).resolves.toBeUndefined();
  expect(parseAst).toHaveBeenCalledTimes(2);
  expect(parseAst.mock.calls[1][2].plugins).toContain("typescript");
});

test("ignores parse failures for diagnostics owned by syntax validation", async () => {
  const parseAst = jest.fn(async () => {
    throw new Error("invalid source");
  });
  await expect(
    scanSourceDependencyFiles(
      "/repo",
      ["src/module.mjs"],
      [],
      new Set(),
      { value: false },
      parseAst,
    ),
  ).resolves.toBeUndefined();
});
