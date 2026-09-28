import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { runJest } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-jest.mjs";
import { resolveSharedJestCli } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-cli.mjs";
import { runChild } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-child.mjs";

test("coordinates prepared command execution and returns the executor result", async () => {
  const execute = jest.fn(async () => ({ code: 0, stdout: "passed", stderr: "" }));
  const result = await runJest(process.cwd(), [], execute, { jestCli: "jest-cli" });
  expect(execute).toHaveBeenCalledTimes(1);
  expect(result).toMatchObject({ code: 0, stdout: "passed" });
  expect(result.coverageDirectory).toBeUndefined();
});

test("cleans coverage artifacts when command execution throws", async () => {
  const removeCoverage = jest.fn();
  await expect(
    runJest(
      process.cwd(),
      undefined,
      () => {
        throw new Error("Jest could not start");
      },
      { jestCli: "jest-cli" },
      removeCoverage,
    ),
  ).rejects.toThrow("Jest could not start");
  expect(removeCoverage).toHaveBeenCalledWith(expect.any(String), {
    recursive: true,
    force: true,
  });
});

test("runs bundled Jest from the consumer root and uses its configuration", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-consumer-jest-root-"));
  const suiteDirectory = join(root, "consumer-suites");
  await mkdir(suiteDirectory);
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "consumer-fixture" }));
  await writeFile(
    join(root, "jest.config.cjs"),
    'module.exports = { testMatch: ["<rootDir>/consumer-suites/configured.consumer.test.cjs"], globalSetup: "<rootDir>/mark-consumer-config.cjs" };',
  );
  await writeFile(
    join(root, "mark-consumer-config.cjs"),
    `const fs = require("node:fs"); module.exports = async () => fs.writeFileSync(${JSON.stringify(join(root, "consumer-config-loaded.txt"))}, process.cwd());`,
  );
  await writeFile(
    join(suiteDirectory, "configured.consumer.test.cjs"),
    `test("uses consumer root", () => expect(process.cwd()).toBe(${JSON.stringify(root)}));`,
  );
  try {
    const result = await runJest(root, [], runChild, {
      jestCli: resolveSharedJestCli(),
      env: { ...process.env, CI: "true" },
    });

    expect(result.code).toBe(0);
    await expect(readFile(join(root, "consumer-config-loaded.txt"), "utf8")).resolves.toBe(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
