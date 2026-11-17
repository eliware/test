import { expect, jest, test } from "@jest/globals";
import { validateSingleDefaultMethods } from "../../../src/checks/shared/single-default-methods.mjs";

const file = "src/run.mjs";

function inventory(source, files = [file]) {
  return {
    files,
    readText: jest.fn(async () => source),
  };
}

test("accepts one default exported function and private helpers", async () => {
  const repo = inventory("function helper() {} function run() { helper(); } export default run;");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("accepts an inline default arrow function", async () => {
  const repo = inventory("export default () => {};");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("requires a named exported function to use the default export", async () => {
  const repo = inventory("export function run() {}");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([`${file} must use a default export for its method.`]);
});

test("rejects multiple exported methods", async () => {
  const repo = inventory("export default function run() {} export function other() {}");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([
    `${file} must use a default export for its method.`,
    `${file} exports more than one method.`,
  ]);
});

test("requires function-valued named exports to use a default export", async () => {
  const repo = inventory("export const run = () => {}; export const other = function () {};");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([
    `${file} must use a default export for its method.`,
    `${file} exports more than one method.`,
  ]);
});

test("ignores named exports that do not export methods", async () => {
  const repo = inventory("export const value = 1;");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("ignores destructured non-identifier method declarations", async () => {
  const repo = inventory("export const { run } = function () {};");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("accepts a default export specifier", async () => {
  const repo = inventory("function run() {} export { run as default };");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("requires a named function specifier to use the default export", async () => {
  const repo = inventory("function run() {} export { run };");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([`${file} must use a default export for its method.`]);
});

test("skips pure export barrels", async () => {
  const repo = inventory('export { run } from "./run.mjs";');
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("reports unreadable source files", async () => {
  const repo = inventory("");
  repo.readText.mockRejectedValue(new Error("unreadable"));
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([`${file} could not be read to check its exported methods.`]);
});

test("reports source that cannot be parsed", async () => {
  const repo = inventory("export default function (");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([`${file} could not be parsed to check its exported methods.`]);
});

test("skips the library main export module", async () => {
  const repo = inventory("export function run() {}");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, { main: ".\\src\\run.mjs" }, "repo", {
      library: true,
    }),
  ).resolves.toEqual([]);
  expect(repo.readText).not.toHaveBeenCalled();
});

test("checks a library source module other than its main export", async () => {
  const repo = inventory("export function run() {}");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, { main: "src/index.mjs" }, "repo", {
      library: true,
    }),
  ).resolves.toEqual([`${file} must use a default export for its method.`]);
});

test("checks library modules when main metadata is absent", async () => {
  const repo = inventory("export function run() {}");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo", { library: true }),
  ).resolves.toEqual([`${file} must use a default export for its method.`]);
});

test("ignores re-exported methods from modules with other implementation", async () => {
  const repo = inventory('const value = 1; export { run } from "./run.mjs";');
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("ignores local export specifiers that do not name methods", async () => {
  const repo = inventory("const value = 1; export { value };");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
});

test("checks only source modules", async () => {
  const repo = inventory("", ["bin/run.mjs", "src/run.js"]);
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, {}, "repo"),
  ).resolves.toEqual([]);
  expect(repo.readText).not.toHaveBeenCalled();
});

test("skips the harness package implementation", async () => {
  const repo = inventory("export function run() {}");
  await expect(
    validateSingleDefaultMethods(repo.files, repo.readText, { name: "@eliware/test" }, "repo"),
  ).resolves.toEqual([]);
  expect(repo.readText).not.toHaveBeenCalled();
});
