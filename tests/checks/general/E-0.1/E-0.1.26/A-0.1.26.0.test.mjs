import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const readRepositoryText = jest.fn();
const parseReleaseNotes = jest.fn();
const validateReleaseNoteContent = jest.fn();
const validateReleaseNoteOrder = jest.fn();
const validateReadmeReleaseNotesLink = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
jest.unstable_mockModule("../../../../../src/checks/read-repository-text.mjs", () => ({
  readRepositoryText,
}));
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
  readFile.mockResolvedValue("release notes");
  readRepositoryText.mockResolvedValue("README");
  parseReleaseNotes.mockReturnValue({ entries: [] });
  validateReleaseNoteContent.mockReturnValue(null);
  validateReleaseNoteOrder.mockReturnValue(null);
  validateReadmeReleaseNotesLink.mockReturnValue(null);
}

beforeEach(resetValidators);

test("coordinates release-note parsing, validation, and README indexing in order", async () => {
  const context = { root: "/repo", packageJson: { version: "8.0.0" } };

  await expect(run(context)).resolves.toEqual({
    ruleId: "A-0.1.26.0",
    status: "pass",
    message: "",
  });
  expect(readFile).toHaveBeenCalledWith(expect.stringMatching(/RELEASE_NOTES\.md$/u), "utf8");
  expect(readRepositoryText).toHaveBeenCalledWith(context, expect.stringMatching(/README\.md$/u));
  expect(validateReleaseNoteContent).toHaveBeenCalledWith([], "8.0.0");
  const phases = [
    parseReleaseNotes.mock.invocationCallOrder[0],
    validateReleaseNoteContent.mock.invocationCallOrder[0],
    validateReleaseNoteOrder.mock.invocationCallOrder[0],
    validateReadmeReleaseNotesLink.mock.invocationCallOrder[0],
  ];
  expect(phases).toEqual([...phases].sort((left, right) => left - right));
});

test("maps missing input files to the check result", async () => {
  readFile.mockRejectedValueOnce(new Error("missing notes"));

  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.26.0",
    status: "fail",
    message: "RELEASE_NOTES.md and README.md are required for release-bearing repositories.",
  });
  expect(parseReleaseNotes).not.toHaveBeenCalled();
});

async function expectFirstFailure(validator, validationError, expectedMessage, laterValidators) {
  validator.mockReturnValueOnce(validationError);
  await expect(run({ root: "/repo", packageJson: { version: "8.0.0" } })).resolves.toEqual({
    ruleId: "A-0.1.26.0",
    status: "fail",
    message: expectedMessage,
  });
  for (const laterValidator of laterValidators) expect(laterValidator).not.toHaveBeenCalled();
}

test("stops at the first parsed or delegated release-note error", async () => {
  parseReleaseNotes.mockReturnValueOnce({ error: "is malformed" });
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "RELEASE_NOTES.md is malformed",
  });
  expect(validateReleaseNoteContent).not.toHaveBeenCalled();

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
