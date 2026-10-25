import { expect, test } from "@jest/globals";
import { createProseParagraphCollector } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/paragraph-collector.mjs";

test("joins text with the first line number and flushes separate paragraphs", () => {
  const collector = createProseParagraphCollector();
  collector.append(" First line ", 2);
  collector.append("continued.", 3);
  collector.flush();
  collector.append("Next.", 5);

  expect(collector.finish()).toEqual([
    { text: "First line continued.", line: 2, kind: "paragraph" },
    { text: "Next.", line: 5, kind: "paragraph" },
  ]);
});

test("ignores blank input and allows repeated flushes", () => {
  const collector = createProseParagraphCollector();
  collector.append(" ", 1);
  collector.flush();
  collector.flush();
  expect(collector.finish()).toEqual([]);
});
