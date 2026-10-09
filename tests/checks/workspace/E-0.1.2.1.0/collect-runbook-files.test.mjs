import { expect, test } from "@jest/globals";
import { collectRunbookFiles } from "../../../../src/checks/workspace/E-0.1.2.1.0/collect-runbook-files.mjs";

test("collects YAML runbooks and reports other files", () => {
  expect(
    collectRunbookFiles([
      "README.md",
      "runbooks/README.md",
      "runbooks/deploy.yaml",
      "runbooks/archive/restore.yaml",
      "runbooks/old.json",
      "runbooks/legacy.yml",
    ]),
  ).toEqual({
    runbooks: ["runbooks/archive/restore.yaml", "runbooks/deploy.yaml"],
    unsupported: [
      "runbooks/old.json must use the .yaml extension.",
      "runbooks/legacy.yml must use the .yaml extension.",
    ],
  });
});

test("returns empty results when no runbook directory exists", () => {
  expect(collectRunbookFiles(["README.md", "docs/guide.md"])).toEqual({
    runbooks: [],
    unsupported: [],
  });
});
