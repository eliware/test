import { expect, test } from "@jest/globals";
import { validateRunbookIndex } from "../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/index.mjs";

test("accepts a navigation index with nested runbook links", () => {
  expect(
    validateRunbookIndex(
      "# Runbooks\n\n- [Deploy](deploy.yaml)\n- [Restore](archive/restore.yaml)",
      ["runbooks/deploy.yaml", "runbooks/archive/restore.yaml"],
    ),
  ).toEqual([]);
});

test("accepts full, collapsed, and shortcut reference links", () => {
  expect(
    validateRunbookIndex(
      "# Runbooks\n\n- [Deploy][deploy]\n- [Restore][]\n- [Archive]\n\n[deploy]: deploy.yaml\n[Restore]: archive/restore.yaml\n[Archive]: archive/third.yaml",
      ["runbooks/deploy.yaml", "runbooks/archive/restore.yaml", "runbooks/archive/third.yaml"],
    ),
  ).toEqual([]);
});

test("rejects prose and missing runbook links", () => {
  expect(validateRunbookIndex("# Runbooks\n\nRead this first.", ["runbooks/deploy.yaml"])).toEqual([
    "runbooks/README.md must contain only headings and runbook links.",
    "runbooks/README.md must link every runbook.",
  ]);
});

test("rejects external, escaping, and non-YAML links", () => {
  const errors = validateRunbookIndex(
    "# Runbooks\n\n- [External](https://example.test/run.yaml)\n- [Escape](../other.yaml)\n- [PDF](guide.pdf)",
    ["runbooks/deploy.yaml"],
  );
  expect(errors).toContain("runbooks/README.md may link only to .yaml runbooks.");
  expect(errors).toContain("runbooks/README.md must link every runbook.");
});

test("rejects unresolved, external, and escaping reference links", () => {
  const errors = validateRunbookIndex(
    "# Runbooks\n\n- [Missing][missing]\n- [External][outside]\n- [Escape][escape]\n\n[outside]: https://example.test/run.yaml\n[escape]: ../outside.yaml",
    ["runbooks/deploy.yaml"],
  );
  expect(errors).toContain("runbooks/README.md may link only to .yaml runbooks.");
  expect(errors).toContain("runbooks/README.md must link every runbook.");
});

test("rejects duplicate links", () => {
  expect(
    validateRunbookIndex("# Runbooks\n\n- [First](deploy.yaml)\n- [Again](deploy.yaml)", [
      "runbooks/deploy.yaml",
    ]),
  ).toContain("runbooks/README.md must link each runbook once.");
});

test("accepts an empty navigation index when no runbooks exist", () => {
  expect(validateRunbookIndex("# Runbooks", [])).toEqual([]);
});
