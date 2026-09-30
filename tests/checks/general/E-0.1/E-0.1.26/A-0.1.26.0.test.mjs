import { beforeEach, expect, jest, test } from "@jest/globals";

const readReleaseNoteDocuments = jest.fn();
const parseReleaseNotes = jest.fn();
const validateReleaseNoteContent = jest.fn();
const validateReleaseNoteOrder = jest.fn();
const validateReadmeReleaseNotesLink = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.26/read-release-note-documents.mjs",
  () => ({ readReleaseNoteDocuments }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.26/parse-release-notes.mjs",
  () => ({ parseReleaseNotes }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.26/validate-release-note-content.mjs",
  () => ({ validateReleaseNoteContent }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.26/validate-release-note-order.mjs",
  () => ({ validateReleaseNoteOrder }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.26/validate-readme-release-notes-link.mjs",
  () => ({ validateReadmeReleaseNotesLink }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.26/A-0.1.26.0.mjs");

function resetValidators() {
  jest.resetAllMocks();
  readReleaseNoteDocuments.mockResolvedValue({
    notes: "release notes",
    readme: "README",
    failures: [],
  });
  parseReleaseNotes.mockReturnValue({ entries: [] });
  validateReleaseNoteContent.mockReturnValue(null);
  validateReleaseNoteOrder.mockReturnValue(null);
  validateReadmeReleaseNotesLink.mockReturnValue(null);
}

beforeEach(resetValidators);

test("coordinates release-note parsing, validation, and README indexing in order", async () => {
  const context = {
    root: "/repo",
    packageJson: { version: "9.0.0", eliware: { apply: ["application"] } },
  };

  await expect(run(context)).resolves.toEqual({
    ruleId: "A-0.1.26.0",
    status: "pass",
    message: "",
  });
  expect(readReleaseNoteDocuments).toHaveBeenCalledWith(context, true);
  expect(validateReleaseNoteContent).toHaveBeenCalledWith([], "9.0.0");
  const phases = [
    parseReleaseNotes.mock.invocationCallOrder[0],
    validateReleaseNoteContent.mock.invocationCallOrder[0],
    validateReleaseNoteOrder.mock.invocationCallOrder[0],
    validateReadmeReleaseNotesLink.mock.invocationCallOrder[0],
  ];
  expect(phases).toEqual([...phases].sort((left, right) => left - right));
});

test("maps missing input files to the check result", async () => {
  readReleaseNoteDocuments.mockResolvedValueOnce({
    readme: "README",
    failures: ["RELEASE_NOTES.md is required for application and library repositories."],
  });

  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.26.0",
    status: "fail",
    message: "RELEASE_NOTES.md is required for application and library repositories.",
  });
  expect(parseReleaseNotes).not.toHaveBeenCalled();
});

test("reports a missing README while validating release notes", async () => {
  readReleaseNoteDocuments.mockResolvedValueOnce({
    notes: "release notes",
    failures: ["README.md is required for release-bearing repositories."],
  });
  const result = await run({ root: "/repo", packageJson: { version: "9.0.0" } });
  expect(result.message).toContain("README.md is required");
  expect(validateReleaseNoteContent).toHaveBeenCalled();
});

test("does not inspect release notes or README for profiles that do not require notes", async () => {
  readReleaseNoteDocuments.mockResolvedValueOnce({
    notes: undefined,
    readme: undefined,
    failures: [],
  });

  await expect(
    run({ root: "/repo", packageJson: { eliware: { apply: ["general", "documentation"] } } }),
  ).resolves.toEqual({ ruleId: "A-0.1.26.0", status: "pass", message: "" });
  expect(readReleaseNoteDocuments).toHaveBeenCalledWith(expect.any(Object), false);
  expect(validateReadmeReleaseNotesLink).not.toHaveBeenCalled();
});

async function expectFirstFailure(validator, validationError, expectedMessage, laterValidators) {
  validator.mockReturnValueOnce(validationError);
  await expect(run({ root: "/repo", packageJson: { version: "9.0.0" } })).resolves.toEqual({
    ruleId: "A-0.1.26.0",
    status: "fail",
    message: expectedMessage,
  });
  for (const laterValidator of laterValidators) expect(laterValidator).toHaveBeenCalled();
}

test("collects parsed and delegated release-note errors", async () => {
  parseReleaseNotes.mockReturnValueOnce({ error: "is malformed" });
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "RELEASE_NOTES.md is malformed",
  });
  expect(validateReleaseNoteContent).toHaveBeenCalled();
  expect(validateReleaseNoteOrder).toHaveBeenCalled();
  expect(validateReadmeReleaseNotesLink).toHaveBeenCalled();

  resetValidators();
  await expectFirstFailure(
    validateReleaseNoteContent,
    "content invalid",
    "RELEASE_NOTES.md content invalid",
    [validateReleaseNoteOrder, validateReadmeReleaseNotesLink],
  );
  resetValidators();
  await expectFirstFailure(
    validateReleaseNoteOrder,
    "order invalid",
    "RELEASE_NOTES.md order invalid",
    [validateReadmeReleaseNotesLink],
  );
  resetValidators();
  await expectFirstFailure(validateReadmeReleaseNotesLink, "link invalid", "link invalid", []);
});
