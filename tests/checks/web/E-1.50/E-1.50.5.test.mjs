import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/web/E-1.50/E-1.50.5.mjs";

test("requires browser validation dependencies and scripts", () => {
  const packageJson = {
    dependencies: { lighthouse: "1", puppeteer: "1" },
    scripts: { lighthouse: "lighthouse", puppeteer: "puppeteer" },
  };
  expect(run({ packageJson }).status).toBe("pass");
  expect(run({ packageJson: { devDependencies: { lighthouse: "1", puppeteer: "1" }, scripts: packageJson.scripts } }).message).toBe("Web applications must directly declare lighthouse.");
  expect(run({ packageJson: { ...packageJson, scripts: { lighthouse: "echo noop", puppeteer: "puppeteer" } } }).status).toBe("fail");
  expect(run({ packageJson: { ...packageJson, scripts: { lighthouse: "echo lighthouse", puppeteer: "puppeteer" } } }).message).toContain("local lighthouse command directly");
  expect(run({ packageJson: { ...packageJson, scripts: { lighthouse: "npx lighthouse", puppeteer: "puppeteer" } } }).message).toContain("local lighthouse command directly");
  expect(run({ packageJson: { ...packageJson, scripts: {} } }).status).toBe("fail");
  expect(
    run({ packageJson: { dependencies: { lighthouse: "1" }, scripts: { lighthouse: "run" } } }).message,
  ).toBe("Web applications' lighthouse script must invoke the local lighthouse command directly.");
  expect(
    run({ packageJson: { dependencies: { lighthouse: "1", puppeteer: "1" }, scripts: { lighthouse: "lighthouse run" } } }).message,
  ).toBe("Web applications must define a puppeteer script.");
  expect(run({ packageJson: {} }).message).toBe("Web applications must directly declare lighthouse.");
});
