import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectExecutableJestTestAliases } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/executable-jest-test-aliases.mjs";

function collect(source, blockedDescribes = new Set()) {
  const program = parse(source, { sourceType: "module" }).program;
  const names = {
    callbacks: new Set(["test", "it"]),
    namespaces: new Set(),
    describes: new Set(["describe", "context"]),
  };
  collectExecutableJestTestAliases(program, names, blockedDescribes);
  return names.callbacks;
}

test("ignores aliases inside uninvoked functions", () => {
  expect(
    collect(
      'import { test } from "@jest/globals"; function unused() { const fake = test; } fake("name", () => {});',
    ),
  ).not.toContain("fake");
});

test("collects dynamic imports and destructured aliases", () => {
  expect(
    collect(
      'const jestApi = await import("@jest/globals"); const { it: run } = jestApi; run("name", () => {});',
    ),
  ).toContain("run");
});

test("ignores non-test properties in a destructured Jest import", () => {
  expect(
    collect(
      'const { describe: suite, test: run } = await import("@jest/globals"); suite("x", () => {});',
    ),
  ).toContain("run");
  expect(
    collect('const { describe: suite } = await import("@jest/globals"); suite("x", () => {});'),
  ).not.toContain("suite");
  expect(collect('const { ...rest } = await import("@jest/globals");')).not.toContain("rest");
});

test("ignores unsupported aliases and skipped suite callbacks", () => {
  expect(
    collect(
      'import { test } from "@jest/globals"; const ignored = 1; describe.skip("suite", () => { const hidden = test; });',
    ),
  ).not.toContain("hidden");
});

test("collects aliases in focused Jest suite callbacks", () => {
  expect(
    collect(
      'import { test } from "@jest/globals"; describe.only("suite", () => { const run = test; run("name", () => {}); });',
    ),
  ).toContain("run");
});

test("ignores callback aliases under non-Jest calls", () => {
  expect(
    collect('import { test } from "@jest/globals"; other("suite", () => { const fake = test; });'),
  ).not.toContain("fake");
});

test("collects aliases inside a function expression suite callback", () => {
  expect(
    collect(
      'import { test } from "@jest/globals"; describe["only"]("suite", function () { const run = test; });',
    ),
  ).toContain("run");
});

test("collects aliases in module code and executable suite callbacks", () => {
  expect(
    collect(
      'import { test } from "@jest/globals"; const direct = test; describe("suite", () => { const nested = direct; nested("name", () => {}); });',
    ),
  ).toEqual(new Set(["test", "it", "direct", "nested"]));
});

test("does not collect aliases in a locally shadowed suite callback", () => {
  expect(
    collect(
      'import { test } from "@jest/globals"; function describe() {} describe("fake", () => { const fake = test; });',
      new Set(["describe"]),
    ),
  ).not.toContain("fake");
});
