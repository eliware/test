import { expect, test } from "@jest/globals";
import {
  formatNpmAuditFailure,
  formatNpmAuditStartupFailure,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/format-npm-audit-diagnostic.mjs";

test("formats and redacts audit output from both streams", () => {
  expect(formatNpmAuditFailure({ code: 1, stdout: "token=hidden", stderr: "hidden" }, {
    NPM_TOKEN: "hidden",
  })).toBe("npm audit failed: token=[REDACTED]\n[REDACTED]");
  expect(formatNpmAuditFailure({ code: 1, stdout: "", stderr: "" }, {})).toBe(
    "npm audit failed without diagnostics.",
  );
  expect(formatNpmAuditFailure({ code: 1, stdout: "audit failed", stderr: "" })).toBe(
    "npm audit failed: audit failed",
  );
});

test("uses the current process environment when no invocation environment is supplied", () => {
  expect(formatNpmAuditStartupFailure(new Error("spawn failed"))).toBe(
    "npm audit could not be started: spawn failed",
  );
});

test("formats startup errors with secret redaction", () => {
  expect(formatNpmAuditStartupFailure(new Error("spawn exposed hidden"), {
    NPM_TOKEN: "hidden",
  })).toBe("npm audit could not be started: spawn exposed [REDACTED]");
});

test("redacts configured secrets embedded between credential delimiters", () => {
  expect(formatNpmAuditFailure({
    code: 1,
    stdout: "NPM_TOKEN=prefix-tiny-secret-suffix",
    stderr: "",
  }, { NPM_TOKEN: "tiny-secret" })).toBe("npm audit failed: NPM_TOKEN=[REDACTED]");
});
