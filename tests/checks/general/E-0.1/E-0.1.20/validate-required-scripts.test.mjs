import { expect, test } from "@jest/globals";
import { validateRequiredScripts } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-required-scripts.mjs";

const scripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

test("accepts the exact shared validation scripts", () => {
  expect(validateRequiredScripts(scripts)).toBeNull();
});

test("reports the first missing or incorrect validation script", () => {
  expect(validateRequiredScripts({ ...scripts, test: "jest" })).toBe("package.json.scripts.test must be exactly eliware-test.");
});

test("requires the npm publication pack script when the profile applies", () => {
  expect(validateRequiredScripts(scripts, { requiresPack: true })).toBe(
    "package.json.scripts.pack must be exactly eliware-test --pack.",
  );
  expect(validateRequiredScripts({ ...scripts, pack: "eliware-test --pack" }, { requiresPack: true })).toBeNull();
});

test("rejects unrelated scripts and malformed capability scripts", () => {
  expect(validateRequiredScripts(null)).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts([])).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts({ ...scripts, start: "node server.mjs" })).toBe(
    "package.json.scripts.start is not allowed by an applicable profile.",
  );
  expect(validateRequiredScripts({ ...scripts, typecheck: " " }, {
    allowedAdditionalScripts: ["typecheck"],
  })).toBe("package.json.scripts.typecheck must be a nonempty command.");
});

test("accepts only explicitly permitted capability and web profile scripts", () => {
  expect(validateRequiredScripts({ ...scripts, typecheck: "tsc --noEmit", build: "vite build" }, {
    allowedAdditionalScripts: ["typecheck", "build"],
  })).toBeNull();
  expect(validateRequiredScripts({ ...scripts, lighthouse: "lighthouse", puppeteer: "node browser.mjs" }, {
    allowedAdditionalScripts: ["lighthouse", "puppeteer"],
  })).toBeNull();
  expect(validateRequiredScripts({ ...scripts, lighthouse: "lighthouse" })).toContain("not allowed");
});
