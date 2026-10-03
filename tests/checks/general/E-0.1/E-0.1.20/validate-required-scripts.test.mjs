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

test("requires every canonical script to be an own package manifest property", () => {
  const inheritedScripts = Object.create(scripts);
  expect(validateRequiredScripts(inheritedScripts)).toContain(
    "package.json.scripts.test must be exactly eliware-test.",
  );
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

test("accepts canonical consumer commands including pack for a published package", () => {
  expect(
    validateRequiredScripts(
      { ...scripts, pack: "eliware-test --pack" },
      { requiresPack: true, selfHosted: false },
    ),
  ).toBeNull();
});

test("allows arbitrary custom scripts while requiring nonempty commands", () => {
  expect(validateRequiredScripts(null)).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts([])).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts("test lint")).toBe("package.json.scripts must be an object.");
  expect(validateRequiredScripts({ ...scripts, start: "node server.mjs" })).toBeNull();
  expect(validateRequiredScripts({ ...scripts, lighthouse: "lighthouse --quiet" })).toBeNull();
  expect(
    validateRequiredScripts({ ...scripts, puppeteer: "node scripts/browser-check.mjs" }),
  ).toBeNull();
  expect(validateRequiredScripts({ ...scripts, unexpected: "" })).toBe(
    "package.json.scripts.unexpected must be a nonempty command.",
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

test("allows profile scripts and arbitrary commands without attempting to validate their tools", () => {
  expect(
    validateRequiredScripts(
      { ...scripts, start: "node server.mjs" },
      {
        allowedAdditionalScripts: ["start"],
      },
    ),
  ).toBeNull();
  expect(
    validateRequiredScripts({ ...scripts, typecheck: "echo skipped", build: "jest" }),
  ).toBeNull();
  expect(
    validateRequiredScripts({ ...scripts, lighthouse: "lighthouse", puppeteer: "puppeteer" }),
  ).toBeNull();
});

test.each(["npm publish", "docker push ghcr.io/example/app:latest", "docker push $GHCR_IMAGE"])(
  "rejects prohibited custom publish script %s",
  (command) => {
    expect(validateRequiredScripts({ ...scripts, release: command })).toContain(
      "package.json.scripts.release must not publish npm packages or GHCR images.",
    );
  },
);

test("does not impose a direct-tool policy on arbitrary custom script commands", () => {
  expect(validateRequiredScripts({ ...scripts, build: "vite build && echo done" })).toBeNull();
});
