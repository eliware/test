import { expect, jest, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveJestBin } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-bin.mjs";

async function createConsumerPackage(metadata) {
  const root = await mkdtemp(join(tmpdir(), "eliware-jest-bin-"));
  const packageRoot = join(root, "node_modules", "jest");
  await mkdir(packageRoot, { recursive: true });
  await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({ main: "./package.json", ...metadata }),
  );
  return { root, packageRoot, requireFromConsumer: createRequire(join(root, "package.json")) };
}

test("resolves an exported Jest bin path", async () => {
  const fixture = await createConsumerPackage({
    name: "jest",
    exports: {
      ".": "./package.json",
      "./package.json": "./package.json",
      "./bin/jest": "./commands/runner.mjs",
    },
    bin: { jest: "commands/runner.mjs" },
  });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    await writeFile(join(fixture.packageRoot, "commands", "runner.mjs"), "");
    expect(resolveJestBin(fixture.requireFromConsumer, "jest")).toBe(
      join(fixture.packageRoot, "commands", "runner.mjs"),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each([
  ["metadata object", { jest: "commands/object.mjs" }, "commands/object.mjs"],
  ["metadata string", "commands/string.mjs", "commands/string.mjs"],
])("resolves Jest's declared bin from %s", async (_label, bin, expected) => {
  const fixture = await createConsumerPackage({ name: "jest", bin });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    await writeFile(join(fixture.packageRoot, expected), "");
    expect(resolveJestBin(fixture.requireFromConsumer, "jest")).toBe(
      join(fixture.packageRoot, expected),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("returns no path for a missing package and rejects malformed installed metadata", async () => {
  const fixture = await createConsumerPackage({ name: "jest" });
  try {
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest")).toThrow(
      "does not declare a Jest executable",
    );
    await writeFile(join(fixture.packageRoot, "package.json"), "{");
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest")).toThrow(SyntaxError);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
  expect(
    resolveJestBin(createRequire(join(tmpdir(), "no-consumer-package.json")), "jest"),
  ).toBeUndefined();
});

test("rejects a declared bin path that does not exist", async () => {
  const fixture = await createConsumerPackage({ name: "jest", bin: { jest: "missing.mjs" } });
  try {
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest")).toThrow("does not exist");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a declared Jest bin whose resolved target escapes through a link", async () => {
  const fixture = await createConsumerPackage({
    name: "jest",
    bin: { jest: "commands/runner.mjs" },
  });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    await writeFile(join(fixture.packageRoot, "commands", "runner.mjs"), "");
    const resolveOutside = (path) =>
      path === fixture.packageRoot ? fixture.packageRoot : join(fixture.root, "outside.mjs");
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest", resolveOutside)).toThrow(
      "escapes its package directory",
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects an exported Jest bin whose resolved target escapes its package", async () => {
  const fixture = await createConsumerPackage({
    name: "jest",
    exports: {
      ".": "./package.json",
      "./package.json": "./package.json",
      "./bin/jest": "./commands/runner.mjs",
    },
  });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    await writeFile(join(fixture.packageRoot, "commands", "runner.mjs"), "");
    const resolveOutside = (path) =>
      path === fixture.packageRoot ? fixture.packageRoot : join(fixture.root, "outside.mjs");
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest", resolveOutside)).toThrow(
      "escapes its package directory",
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a declared Jest bin path that escapes its package", async () => {
  const fixture = await createConsumerPackage({ name: "jest", bin: { jest: "../../outside.mjs" } });
  try {
    await writeFile(join(fixture.root, "outside.mjs"), "");
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest")).toThrow(
      "escapes its package directory",
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects an empty declared Jest bin path", async () => {
  const fixture = await createConsumerPackage({ name: "jest", bin: "" });
  try {
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest")).toThrow(
      "does not declare a Jest executable",
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("falls back when the exported Jest bin path resolves to a directory", async () => {
  const fixture = await createConsumerPackage({ name: "jest", bin: "commands/runner.mjs" });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    const runner = join(fixture.packageRoot, "commands", "runner.mjs");
    await writeFile(runner, "");
    const resolveFromConsumer = jest.fn((specifier) =>
      specifier === "jest/bin/jest"
        ? fixture.packageRoot
        : join(fixture.packageRoot, "package.json"),
    );
    const requireFromConsumer = { resolve: resolveFromConsumer };

    expect(resolveJestBin(requireFromConsumer, "jest")).toBe(runner);
    expect(resolveFromConsumer).toHaveBeenCalledWith("jest/bin/jest");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a declared Jest bin that resolves to a directory", async () => {
  const fixture = await createConsumerPackage({ name: "jest", bin: "commands" });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    expect(() => resolveJestBin(fixture.requireFromConsumer, "jest")).toThrow("does not exist");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rethrows unexpected package resolution errors", () => {
  const error = new Error("resolver failure");
  expect(() =>
    resolveJestBin(
      {
        resolve: () => {
          throw error;
        },
      },
      "jest",
    ),
  ).toThrow(error);
});
