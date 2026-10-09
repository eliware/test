import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/web/E-0.1.6.1.2.mjs";

test("requires direct Lighthouse and Puppeteer dependencies and scripts", () => {
  expect(run()).toMatchObject({ status: "fail" });
  expect(
    run({
      packageJson: {
        dependencies: { lighthouse: "1", puppeteer: "1" },
        scripts: { lighthouse: "lighthouse", puppeteer: "puppeteer" },
      },
    }),
  ).toEqual({ ruleId, status: "pass", message: "" });
  expect(run({ packageJson: {} })).toEqual({
    ruleId,
    status: "fail",
    message:
      "Web applications must directly declare lighthouse.\n" +
      "Web applications must define a nonempty lighthouse script.\n" +
      "Web applications must directly declare puppeteer.\n" +
      "Web applications must define a nonempty puppeteer script.",
  });
  expect(
    run({
      packageJson: {
        dependencies: { lighthouse: "1" },
        scripts: { lighthouse: "   ", puppeteer: false },
      },
    }).message,
  ).toContain("Web applications must define a nonempty puppeteer script.");
});

test("accepts direct browser tool dependencies in development dependencies", () => {
  const result = run({
    packageJson: {
      devDependencies: { lighthouse: "1", puppeteer: "1" },
      scripts: { lighthouse: "lighthouse", puppeteer: "puppeteer" },
    },
  });
  expect(result).toEqual({ ruleId, status: "pass", message: "" });
});
