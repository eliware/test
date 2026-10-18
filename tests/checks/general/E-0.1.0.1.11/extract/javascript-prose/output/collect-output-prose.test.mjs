import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectOutputProse } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose.mjs";

test("collects prose from JSX, output calls, and visible properties", () => {
  const ast = parse(
    '<button title="Open" aria-label={"Select"}>Visible</button>; console.log("Printed"); element.textContent = "Ready"; element.setAttribute("placeholder", "Search"); element.className = "machine"; element.setAttribute("class", "machine");',
    { sourceType: "module", plugins: ["jsx"] },
  ).program;
  const [element, output, assignment, setAttribute, machineAssignment, machineAttribute] =
    ast.body.map((statement) => statement.expression);
  const blocks = [];

  expect(collectOutputProse(element.openingElement.attributes[0], blocks)).toBe(false);
  expect(collectOutputProse(element.openingElement.attributes[1], blocks)).toBe(false);
  expect(collectOutputProse(element.children[0], blocks)).toBe(false);
  collectOutputProse(output, blocks);
  collectOutputProse(assignment, blocks);
  collectOutputProse(setAttribute, blocks);
  collectOutputProse(machineAssignment, blocks);
  collectOutputProse(machineAttribute, blocks);

  expect(blocks.map(({ text }) => text)).toEqual([
    "Open",
    "Select",
    "Visible",
    "Printed",
    "Ready",
    "Search",
  ]);
});
