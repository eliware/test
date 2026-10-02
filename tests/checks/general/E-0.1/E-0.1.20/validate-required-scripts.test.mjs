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

test("allows only the local CLI scripts for the self-hosting package", () => {
  const selfHostedScripts = {
    test: "node bin/eliware-test.mjs",
    lint: "node bin/eliware-test.mjs --lint",
    audit: "node bin/eliware-test.mjs --audit",
    format: "node bin/eliware-test.mjs --format",
    "format:check": "node bin/eliware-test.mjs --format-check",
    pack: "node bin/eliware-test.mjs --pack",
  };
  expect(
    validateRequiredScripts(selfHostedScripts, { requiresPack: true, selfHosted: true }),
  ).toBeNull();
  expect(
    validateRequiredScripts(
      { ...selfHostedScripts, audit: "npm audit" },
      {
        requiresPack: true,
        selfHosted: true,
      },
    ),
  ).toContain("package.json.scripts.audit must be exactly node bin/eliware-test.mjs --audit");
  expect(validateRequiredScripts(selfHostedScripts)).toContain(
    "package.json.scripts.test must be exactly eliware-test",
  );
});

test("reports every incorrect required validation script", () => {
  const result = validateRequiredScripts({ ...scripts, test: "jest", lint: "eslint" });

  expect(result).toContain("package.json.scripts.test must be exactly eliware-test.");
  expect(result).toContain("package.json.scripts.lint must be exactly eliware-test --lint.");
});

test.each([null, "", "  ", 42])("reports malformed required scripts once: %s", (testCommand) => {
  expect(validateRequiredScripts({ ...scripts, test: testCommand })).toBe(
    "package.json.scripts.test must be a nonempty command.",
  );
});

test("requires the npm publication pack script when the profile applies", () => {
  expect(validateRequiredScripts(scripts, { requiresPack: true })).toBe(
    "package.json.scripts.pack must be exactly eliware-test --pack.",
  );
  expect(
    validateRequiredScripts({ ...scripts, pack: "eliware-test --pack" }, { requiresPack: true }),
  ).toBeNull();
});

test("rejects unrelated scripts and malformed capability scripts", () => {
  expect(validateRequiredScripts(null)).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts([])).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts("test lint")).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts({ ...scripts, start: "node server.mjs" })).toBe(
    "package.json.scripts.start is not allowed by an applicable profile.",
  );
  expect(validateRequiredScripts({ ...scripts, unexpected: "" })).toBe(
    "package.json.scripts.unexpected is not allowed by an applicable profile.",
  );
  expect(
    validateRequiredScripts(
      { ...scripts, typecheck: " " },
      {
        allowedAdditionalScripts: ["typecheck"],
      },
    ),
  ).toBe("package.json.scripts.typecheck must be a nonempty command.");
});

test("accepts only explicitly permitted capability and web profile scripts", () => {
  expect(
    validateRequiredScripts(
      { ...scripts, start: "node server.mjs" },
      {
        allowedAdditionalScripts: ["start"],
      },
    ),
  ).toBeNull();
  expect(
    validateRequiredScripts(
      { ...scripts, typecheck: "tsc --noEmit", build: "vite build" },
      {
        allowedAdditionalScripts: ["typecheck", "build"],
      },
    ),
  ).toBeNull();
  expect(
    validateRequiredScripts(
      { ...scripts, typecheck: "tsc --noEmit", build: "vite build" },
      {
        allowedAdditionalScripts: ["typecheck", "build"],
      },
    ),
  ).toBeNull();
  expect(
    validateRequiredScripts(
      { ...scripts, typecheck: "echo skipped", build: "jest" },
      { allowedAdditionalScripts: ["typecheck", "build"] },
    ),
  ).toContain("must invoke a direct typechecker");
  expect(
    validateRequiredScripts(
      { ...scripts, lighthouse: "lighthouse" },
      { allowedAdditionalScripts: ["build"] },
    ),
  ).toContain("not allowed");
});
