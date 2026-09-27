import { expect, jest, test } from "@jest/globals";
import { loadReadmeValidationInputs } from "../../../../../src/checks/general/E-0.1/E-0.1.1/load-readme-validation-inputs.mjs";

test("loads README text and cached sections using the package profile", async () => {
  const content = "## Features\nUseful\n## License\nMIT";
  const readText = jest.fn(async () => content);
  const readParsed = jest.fn(async (_path, _cacheKey, parse) => parse(content));
  const context = {
    root: "/repo",
    packageJson: { eliware: { apply: ["application"] } },
    repositoryInventory: { readText, readParsed },
  };

  const result = await loadReadmeValidationInputs(context);
  expect(result.readme).toBe(content);
  expect(result.sections.get("Features")).toBe("useful");
  expect(readText).toHaveBeenCalledWith(expect.stringMatching(/README\.md$/u));
  expect(readParsed).toHaveBeenCalledWith(
    expect.stringMatching(/README\.md$/u),
    'readme:sections:["application"]',
    expect.any(Function),
  );
});

test("returns no inputs when README text cannot be read", async () => {
  const readText = jest.fn().mockRejectedValue(new Error("missing README"));
  const readParsed = jest.fn();
  const context = { root: "/repo", repositoryInventory: { readText, readParsed } };

  await expect(loadReadmeValidationInputs(context)).resolves.toBeNull();
  expect(readParsed).not.toHaveBeenCalled();
});
