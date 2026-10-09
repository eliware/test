import { expect, test } from "@jest/globals";
import { validateAgentsCompositionOrder } from "../../../../src/checks/shared/E-0.1.0.1.2/validate-agents-composition-order.mjs";

const agents =
  "# AGENTS.md\n\n## Project\n## Scope and boundaries\n## Layout\n## Development\n## Validation\n## Security\n## Changes";

test("checks selected profile order without requiring profile headings", () => {
  expect(
    validateAgentsCompositionOrder(`${agents}\n## Application\n## CLI`, {
      eliware: { apply: ["general", "application", "cli"] },
    }),
  ).toEqual([]);
  expect(
    validateAgentsCompositionOrder(agents, { eliware: { apply: ["general", "cli"] } }),
  ).toEqual([]);
});

test("rejects unselected and misordered profile headings", () => {
  expect(
    validateAgentsCompositionOrder(`${agents}\n## CLI`, {
      eliware: { apply: ["general", "application"] },
    }),
  ).toEqual(["AGENTS.md profile headings must use canonical order after Changes."]);
  expect(
    validateAgentsCompositionOrder(`${agents}\n## CLI\n## Application`, {
      eliware: { apply: ["general", "application", "cli"] },
    }),
  ).toEqual(["AGENTS.md profile headings must use canonical order after Changes."]);
});
