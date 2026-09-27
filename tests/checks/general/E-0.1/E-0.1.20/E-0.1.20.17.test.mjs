import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.17.mjs";

const scripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

test("requires the exact shared validation scripts", async () => {
  await expect(run({ packageJson: { scripts } })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "pass",
    message: "",
  });
  await expect(run({ packageJson: { scripts: { ...scripts, test: "jest" } } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("allows typecheck and build scripts only for declared capabilities", async () => {
  await expect(
    run({ packageJson: { scripts: { ...scripts, typecheck: "tsc --noEmit", build: "vite build" } } }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("typecheck") });
  await expect(
    run({ packageJson: {
      scripts: { ...scripts, typecheck: "tsc --noEmit", build: "vite build" },
      eliware: { capabilities: ["typecheck", "build"] },
    } }),
  ).resolves.toMatchObject({ status: "pass" });
});

test("rejects undeclared runtime entrypoint and unrelated scripts", async () => {
  await expect(run({
    packageJson: {
      scripts: { ...scripts, start: "node server.mjs" },
      eliware: { apply: ["application"] },
    },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("start") });
  await expect(run({
    packageJson: {
      scripts: { ...scripts, deploy: "node deploy.mjs" },
      eliware: { apply: ["application"] },
    },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("deploy") });
});

test("requires the pack script when the npm publication profile applies", async () => {
  await expect(
    run({
      packageJson: {
        scripts: { ...scripts, pack: "eliware-test --pack" },
        eliware: { apply: ["npm-published"] },
      },
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(
    run({ packageJson: { scripts, eliware: { apply: ["npm-published"] } } }),
  ).resolves.toMatchObject({
    status: "fail",
    message: "package.json.scripts.pack must be exactly eliware-test --pack.",
  });
});

test("allows Lighthouse and Puppeteer scripts for the applied web profile", async () => {
  for (const [name, command] of [
    ["lighthouse", "lighthouse"],
    ["puppeteer", "node browser-check.mjs"],
  ]) {
    await expect(run({
      packageJson: { scripts: { ...scripts, [name]: command }, eliware: { apply: ["web"] } },
    })).resolves.toMatchObject({ status: "pass" });
  }
  await expect(run({
    packageJson: {
      scripts: { ...scripts, lighthouse: "lighthouse", puppeteer: "node browser-check.mjs" },
      eliware: { apply: ["web"] },
    },
  })).resolves.toMatchObject({ status: "pass" });
});

test("rejects unsupported direct formatter modes", async () => {
  await expect(run({ packageJson: { scripts }, mode: "unrecognized" })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Unsupported formatter mode: unrecognized.",
  });
});

test("runs the formatter in aggregate and explicit format modes", async () => {
  const calls = [];
  const runFormatter = async (root, options) => {
    calls.push({ root, options });
    return { code: 0, stdout: "", stderr: "" };
  };
  for (const mode of [null, "format-check", "format"]) {
    await expect(
      run({ packageJson: { scripts }, root: "/repo", executeFormat: true, mode, runFormatter }),
    ).resolves.toEqual({
      ruleId: "E-0.1.20.17",
      status: "pass",
      message: "",
    });
  }
  expect(calls).toEqual([
    { root: "/repo", options: { write: false, extraArgs: [] } },
    { root: "/repo", options: { write: false, extraArgs: [] } },
    { root: "/repo", options: { write: true, extraArgs: [] } },
  ]);
});

test("reports formatter failures", async () => {
  const result = await run({
    packageJson: { scripts },
    root: "/repo",
    executeFormat: true,
    mode: "format-check",
    runFormatter: async () => ({ code: 1, stdout: "bad.js", stderr: "" }),
  });
  expect(result).toEqual(
    expect.objectContaining({ status: "fail", message: "Prettier failed: bad.js" }),
  );
});

test("reports formatter failures without diagnostics", async () => {
  await expect(
    run({
      packageJson: { scripts },
      root: "/repo",
      executeFormat: true,
      mode: "format-check",
      runFormatter: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Prettier failed without diagnostics.",
  });
});

test("reports formatter startup failures", async () => {
  await expect(
    run({
      packageJson: { scripts },
      root: "/repo",
      executeFormat: true,
      mode: "format",
      runFormatter: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Prettier could not be started: spawn failed",
  });
});
