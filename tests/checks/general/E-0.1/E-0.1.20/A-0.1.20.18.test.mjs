import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import {
  resolveCanonicalPrettierConfiguration,
  run,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/A-0.1.20.18.mjs";

const conventionPath = join(process.cwd(), "specs", "conventions", "general.yaml");
const canonical = resolveCanonicalPrettierConfiguration(
  parse(await readFile(conventionPath, "utf8")),
);

async function createRoot() {
  return mkdtemp(join(tmpdir(), "eliware-prettier-config-"));
}

test("reads canonical Prettier settings from the general convention", () => {
  expect(canonical).toEqual({
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    quoteProps: "as-needed",
    jsxSingleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    proseWrap: "preserve",
    endOfLine: "lf",
  });
  expect(() => resolveCanonicalPrettierConfiguration({ directives: [] })).toThrow(
    "general.yaml must define the canonical Prettier JSON configuration.",
  );
});

test("requires exact package.json Prettier settings", async () => {
  const root = await createRoot();
  try {
    await expect(run({ root, packageJson: { prettier: canonical } })).resolves.toEqual({
      ruleId: "A-0.1.20.18",
      status: "pass",
      message: "",
    });
    for (const prettier of [
      undefined,
      [],
      "invalid",
      { ...canonical, printWidth: 80 },
      { ...canonical, extraOption: true },
      Object.fromEntries(Object.entries(canonical).filter(([key]) => key !== "endOfLine")),
    ]) {
      await expect(run({ root, packageJson: { prettier } })).resolves.toEqual(
        expect.objectContaining({ status: "fail" }),
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("loads the bundled convention without a consumer copy", async () => {
  const root = await createRoot();
  const repositoryInventory = {
    files: async () => [],
  };
  try {
    await expect(
      run({ root, packageJson: { prettier: canonical }, repositoryInventory }),
    ).resolves.toMatchObject({
      status: "pass",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports repository inventory errors", async () => {
  const root = await createRoot();
  try {
    await expect(
      run({
        root,
        packageJson: { prettier: canonical },
        repositoryInventory: {
          files: async () => {
            throw new Error("inventory unavailable");
          },
        },
      }),
    ).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("inventory unavailable"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each([".prettierrc", ".prettierrc.json", "prettier.config.mjs", "nested/.prettierrc.yaml"])(
  "rejects standalone Prettier config %s",
  async (file) => {
    const root = await createRoot();
    try {
      const path = join(root, file);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, "{}\n");
      await expect(run({ root, packageJson: { prettier: canonical } })).resolves.toEqual(
        expect.objectContaining({
          ruleId: "A-0.1.20.18",
          status: "fail",
          message: expect.stringContaining(file.replaceAll("\\", "/")),
        }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
