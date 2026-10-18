import { expect, jest, test } from "@jest/globals";
import { loadUnapprovedDictionary } from "../../../../../src/checks/general/E-0.1.0.1.11/load/unapproved-dictionary.mjs";
import { validateRepositoryLanguageFiles } from "../../../../../src/checks/general/E-0.1.0.1.11/validate/repository-language-files.mjs";

const dictionary = loadUnapprovedDictionary();
const examples = new Set();

test("skips SQL statements and syntax while reporting matching words in prose", async () => {
  const source = [
    'const query = "SELECT alignment, base, facility, fix, join, portion, real, transition, trim FROM nasr";',
    "const JOIN_POINT = `LEFT JOIN FIX_BASE ON FIX_BASE.BASE_ID = ${procedureId}`;",
    'const usage = "Usage: radar --port PORT";',
    'const icon = <svg><g transform="rotate(90) rotate(180)" /></svg>;',
    'rose.setAttribute("transform", `rotate(${angle})`);',
    'const message = "Alignment, facility, portion, transition, trim, and rotate words.";',
  ].join("\n");
  const inventory = { readText: jest.fn(async () => source) };
  const errors = await validateRepositoryLanguageFiles(
    ["src/messages.mjs"],
    inventory,
    dictionary,
    examples,
  );

  expect(errors).toHaveLength(6);
  for (const word of ["Alignment", "facility", "portion", "transition", "trim", "rotate"]) {
    expect(errors.join("\n")).toContain(`uses "${word}"`);
  }
  expect(errors.join("\n")).not.toContain('uses "PORT"');
  expect(inventory.readText).toHaveBeenCalledTimes(1);
});

test("ignores unsupported files and internal code paths", async () => {
  const inventory = { readText: jest.fn() };
  await expect(
    validateRepositoryLanguageFiles(
      ["image.svg", "tests/example.mjs", "examples/query.sql"],
      inventory,
      dictionary,
      examples,
    ),
  ).resolves.toEqual([]);
  expect(inventory.readText).not.toHaveBeenCalled();
});
