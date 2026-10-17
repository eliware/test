import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findNetworkProcessViolations } from "../../../../../src/validation/harness/test-isolation/find/network-process-violations.mjs";

test("rejects external and unknown fetch calls and direct process effects", () => {
  const source =
    'fetch("https://example.com"); fetch(target); process.exit(1); process["kill"](1); import("../module.mjs"); (() => {})();';
  expect(findNetworkProcessViolations(parse(source), source)).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
    "must mock process effects or inject the process dependency.",
  ]);
});

test("allows localhost fetch and mocked global fetch", () => {
  const local = 'fetch("http://localhost:3000/health");';
  expect(findNetworkProcessViolations(parse(local), local)).toEqual([]);
  const mocked = 'jest.spyOn(globalThis, "fetch"); fetch("https://example.com");';
  expect(findNetworkProcessViolations(parse(mocked), mocked)).toEqual([]);
  const namespaced = 'globalThis.fetch("https://example.com");';
  expect(findNetworkProcessViolations(parse(namespaced), namespaced)).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
  const computed = 'globalThis["fetch"]("https://example.com");';
  expect(findNetworkProcessViolations(parse(computed), computed)).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
});

test("detects aliases for global fetch and process calls", () => {
  const source =
    'const request = fetch; const runtime = process; const quit = process.exit; request("https://example.com"); runtime.kill(1); quit(1);';
  expect(findNetworkProcessViolations(parse(source), source)).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
    "must mock process effects or inject the process dependency.",
  ]);
});

test("rejects malformed URLs and allows injected process calls", () => {
  const source = 'fetch("localhost/path"); runtime.process.exit(1);';
  expect(findNetworkProcessViolations(parse(source), source)).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
});
