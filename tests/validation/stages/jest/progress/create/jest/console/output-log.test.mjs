import { expect, jest, test } from "@jest/globals";
import { createJestConsoleOutputLog } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/output-log.mjs";

function makeLog(options = {}) {
  const files = new Map();
  const append = jest.fn((path, text) => files.set(path, `${files.get(path) ?? ""}${text}`));
  const replace = jest.fn((path, text) => files.set(path, text));
  return {
    files,
    append,
    replace,
    log: createJestConsoleOutputLog("coverage/jest.log", {
      append,
      replace,
      ...options,
    }),
  };
}

test("streams output while Jest runs and redacts secrets after close", () => {
  const { files, log } = makeLog();
  log.start();
  log.append("stdout", "");
  log.append("stdout", "token-");
  log.append("stdout", "value");
  log.append("stderr", "warning");

  expect(files.get("coverage/jest.log")).toBe("token-valuewarning");
  expect(log.finish(["token-value"])).toEqual({
    redacted: true,
    redactionKinds: ["environment secret"],
    writeError: false,
  });
  expect(files.get("coverage/jest.log")).toBe("[REDACTED]warning");
});

test("caps saved output and skips later chunks", () => {
  const { files, log } = makeLog({ maxLength: 3 });
  log.start();
  log.append("stdout", "1234");
  log.append("stderr", "later");

  expect(log.finish()).toEqual({ redacted: false, redactionKinds: [], writeError: false });
  expect(files.get("coverage/jest.log")).toContain("123");
  expect(files.get("coverage/jest.log")).toContain("output was truncated");
});

test("reports credential fields, HTTP credentials, and known token formats", () => {
  const { log } = makeLog();
  log.start();
  log.append("stdout", "password=hidden Authorization: Bearer abc123 ghp_abcdef123456");

  expect(log.finish()).toEqual({
    redacted: true,
    redactionKinds: ["credential field", "HTTP credential", "known token format"],
    writeError: false,
  });
});

test("reports generic Base64 credentials", () => {
  const { files, log } = makeLog();
  log.start();
  log.append("stdout", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef");

  expect(log.finish()).toEqual({
    redacted: true,
    redactionKinds: ["generic Base64 credential"],
    writeError: false,
  });
  expect(files.get("coverage/jest.log")).toBe("[REDACTED]");
});

test("handles an absent log path and ignores invalid streams", () => {
  const replace = jest.fn();
  const append = jest.fn();
  const log = createJestConsoleOutputLog(undefined, { append, replace });
  log.start();
  log.append("unknown", "text");
  log.append("stdout", "text");

  expect(log.finish()).toEqual({ redacted: false, redactionKinds: [], writeError: false });
  expect(append).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

test("uses default output operations without writing when the path is absent", () => {
  const log = createJestConsoleOutputLog(undefined);
  log.start();
  log.append("stdout", "text");
  expect(log.finish()).toEqual({ redacted: false, redactionKinds: [], writeError: false });
});

test("reports log write failures without throwing", () => {
  const replace = jest.fn(() => {
    throw new Error("write blocked");
  });
  const { log } = makeLog({ replace });
  log.start();
  log.append("stdout", "ignored");

  expect(log.finish()).toEqual({ redacted: false, redactionKinds: [], writeError: true });
});

test("reports stream write failures and retains a safe plain-text log", () => {
  const { files, log } = makeLog({
    append: () => {
      throw new Error("append blocked");
    },
  });
  log.start();
  log.append("stdout", "text");

  expect(log.finish()).toEqual({ redacted: false, redactionKinds: [], writeError: true });
  expect(files.get("coverage/jest.log")).toBe("text");
});
