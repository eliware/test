import { beforeEach, expect, jest, test } from "@jest/globals";

const readKnitScript = jest.fn();
const validateKnitCommandStructure = jest.fn();
const validateKnitSourceOperations = jest.fn();
const validateKnitPublicationCommands = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.10/read-knit-script.mjs",
  () => ({ readKnitScript }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-command-structure.mjs",
  () => ({ validateKnitCommandStructure }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-source-operations.mjs",
  () => ({ validateKnitSourceOperations }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-publication-commands.mjs",
  () => ({ validateKnitPublicationCommands }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.10/E-0.1.10.0.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  readKnitScript.mockResolvedValue({ source: "source", parsed: { calls: [] } });
  validateKnitCommandStructure.mockReturnValue(null);
  validateKnitSourceOperations.mockReturnValue(null);
  validateKnitPublicationCommands.mockReturnValue(null);
});

test("coordinates command, source, and publication policies in order", async () => {
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "pass",
    message: "",
  });
  expect(readKnitScript).toHaveBeenCalledWith({ root: "/repo" });
  expect(validateKnitCommandStructure).toHaveBeenCalledWith({ calls: [] });
  expect(validateKnitSourceOperations).toHaveBeenCalledWith("source", undefined, []);
  expect(validateKnitPublicationCommands).toHaveBeenCalledWith([]);
  const order = [
    validateKnitCommandStructure,
    validateKnitSourceOperations,
    validateKnitPublicationCommands,
  ].map((phase) => phase.mock.invocationCallOrder[0]);
  expect(order).toEqual([...order].sort((left, right) => left - right));
});

test("maps missing and syntactically invalid Knit script findings", async () => {
  readKnitScript.mockResolvedValueOnce({ error: "Knit script could not be read" });
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "fail",
    message: "Knit script could not be read",
  });
  readKnitScript.mockRejectedValueOnce(new Error("missing"));
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "fail",
    message: ".knit/validate.mjs is required for Knit validation.",
  });
  readKnitScript.mockResolvedValueOnce({ parsed: { error: "invalid JavaScript" } });
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "fail",
    message: "invalid JavaScript",
  });
  expect(validateKnitCommandStructure).not.toHaveBeenCalled();
});

test("stops at the first policy finding", async () => {
  validateKnitCommandStructure.mockReturnValueOnce("command structure invalid");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "command structure invalid",
  });
  expect(validateKnitSourceOperations).not.toHaveBeenCalled();

  validateKnitSourceOperations.mockReturnValueOnce("source operation invalid");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "source operation invalid",
  });
  expect(validateKnitPublicationCommands).not.toHaveBeenCalled();
});

test("maps publication policy findings to the rule result", async () => {
  validateKnitPublicationCommands.mockReturnValueOnce("publication command prohibited");
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.10.0",
    status: "fail",
    message: "publication command prohibited",
  });
});
