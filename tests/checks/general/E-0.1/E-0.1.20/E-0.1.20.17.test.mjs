import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.17.mjs";

const scripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

test("rejects unsupported formatter modes", async () => {
  await expect(run({ packageJson: { scripts }, mode: "unknown" })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Unsupported formatter mode: unknown.",
  });
});

test("maps applied profiles and capabilities into required script policy", async () => {
  const scriptsWithCapabilities = {
    ...scripts,
    typecheck: "tsc --noEmit",
    build: "vite build",
    lighthouse: "lighthouse",
    puppeteer: "node browser-check.mjs",
  };
  await expect(run({
    packageJson: { scripts: scriptsWithCapabilities },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("typecheck") });
  await expect(run({
    packageJson: {
      scripts: { ...scriptsWithCapabilities, pack: "eliware-test --pack" },
      eliware: { apply: ["npm-published", "web"], capabilities: ["typecheck", "build"] },
    },
  })).resolves.toMatchObject({ status: "pass" });
  await expect(run({
    packageJson: { scripts, eliware: { apply: ["npm-published"] } },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("pack") });
});

test("runs formatter only for requested stages and passes mode through", async () => {
  const runFormatter = jest.fn(async () => ({ code: 0, stdout: "", stderr: "" }));
  await expect(run({ packageJson: { scripts }, root: "/repo", executeFormat: false, runFormatter }))
    .resolves.toMatchObject({ status: "pass" });
  await expect(run({ packageJson: { scripts }, root: "/repo", executeFormat: true, runFormatter }))
    .resolves.toMatchObject({ status: "pass" });
  await expect(run({ packageJson: { scripts }, root: "/repo", mode: "format", runFormatter }))
    .resolves.toMatchObject({ status: "pass" });
  expect(runFormatter.mock.calls.map(([, options]) => options.write)).toEqual([false, true]);
});

test("maps formatter failure to the check result", async () => {
  await expect(run({
    packageJson: { scripts },
    root: "/repo",
    mode: "format-check",
    runFormatter: async () => ({ code: 1, stdout: "file formatting failed", stderr: "" }),
  })).resolves.toEqual({
    ruleId: "E-0.1.20.17",
    status: "fail",
    message: "Prettier failed: file formatting failed",
  });
});
