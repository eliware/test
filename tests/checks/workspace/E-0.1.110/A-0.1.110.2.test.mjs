import { beforeEach, expect, jest, test } from "@jest/globals";

const loadRunbookRecords = jest.fn();
const readRunbookRecords = jest.fn();
const validateReferences = jest.fn();
const validateRunbookRecords = jest.fn();
const validateRunbookIndexCoverage = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/workspace/E-0.1.110/load-runbook-records.mjs",
  () => ({ loadRunbookRecords }),
);
jest.unstable_mockModule(
  "../../../../src/checks/workspace/E-0.1.110/read-runbook-records.mjs",
  () => ({ readRunbookRecords }),
);
jest.unstable_mockModule(
  "../../../../src/checks/workspace/E-0.1.110/runbook-references.mjs",
  () => ({ validateReferences }),
);
jest.unstable_mockModule(
  "../../../../src/checks/workspace/E-0.1.110/validate-runbook-records.mjs",
  () => ({ validateRunbookRecords }),
);
jest.unstable_mockModule(
  "../../../../src/checks/workspace/E-0.1.110/validate-runbook-index-coverage.mjs",
  () => ({ validateRunbookIndexCoverage }),
);

const { run } = await import("../../../../src/checks/workspace/E-0.1.110/A-0.1.110.2.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  loadRunbookRecords.mockResolvedValue({ files: ["runbooks/deploy.json"] });
  readRunbookRecords.mockResolvedValue([{ file: "runbooks/deploy.json", record: {} }]);
  validateRunbookRecords.mockReturnValue({ error: null, filesByPath: new Map() });
  validateReferences.mockResolvedValue(null);
  validateRunbookIndexCoverage.mockReturnValue(null);
});

test("coordinates each runbook validation phase in order", async () => {
  const context = { root: "/repo", repositoryInventory: {} };
  await expect(run(context)).resolves.toEqual({
    ruleId: "A-0.1.110.2",
    status: "pass",
    message: "",
  });
  expect(loadRunbookRecords).toHaveBeenCalledWith("/repo", context);
  expect(readRunbookRecords).toHaveBeenCalledWith(
    ["runbooks/deploy.json"],
    context.repositoryInventory,
  );
  expect(validateReferences).toHaveBeenCalledWith(
    "/repo",
    expect.any(Map),
    expect.any(Set),
    expect.objectContaining(context),
  );
  expect(validateRunbookIndexCoverage).toHaveBeenCalledWith(
    ["runbooks/deploy.json"],
    expect.any(Set),
  );
  const phaseOrder = [
    loadRunbookRecords,
    readRunbookRecords,
    validateRunbookRecords,
    validateReferences,
    validateRunbookIndexCoverage,
  ].map((phase) => phase.mock.invocationCallOrder[0]);
  expect(phaseOrder).toEqual([...phaseOrder].sort((left, right) => left - right));
});

test("maps a missing runbook index to a rule failure", async () => {
  loadRunbookRecords.mockRejectedValueOnce(new Error("index missing"));
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.110.2",
    status: "fail",
    message: "Workspace repositories require runbooks/README.md and JSON runbook records.",
  });
  expect(readRunbookRecords).not.toHaveBeenCalled();
});

test.each([
  ["record schema", () => validateRunbookRecords.mockReturnValueOnce({ error: "record invalid" })],
  ["reference resolution", () => validateReferences.mockResolvedValueOnce("reference invalid")],
  ["index coverage", () => validateRunbookIndexCoverage.mockReturnValueOnce("index incomplete")],
])("maps %s findings and still runs independent later phases", async (_phase, prepareFailure) => {
  prepareFailure();
  const result = await run({ root: "/repo" });
  expect(result).toMatchObject({ ruleId: "A-0.1.110.2", status: "fail" });
  if (_phase === "record schema") {
    expect(result.message).toBe("record invalid");
    expect(validateReferences).toHaveBeenCalled();
    expect(validateRunbookIndexCoverage).toHaveBeenCalled();
  }
  if (_phase === "reference resolution") {
    expect(result.message).toBe("reference invalid");
    expect(validateRunbookIndexCoverage).toHaveBeenCalled();
  }
  if (_phase === "index coverage") expect(result.message).toBe("index incomplete");
});

test("maps record-reading errors to a JSON validation failure", async () => {
  readRunbookRecords.mockRejectedValueOnce(new SyntaxError("unexpected token"));
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.110.2",
    status: "fail",
    message: "Runbook records must be valid JSON: unexpected token",
  });
  expect(validateRunbookRecords).not.toHaveBeenCalled();
});
