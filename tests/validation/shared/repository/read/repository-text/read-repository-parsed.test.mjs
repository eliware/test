import { expect, jest, test } from "@jest/globals";
import readRepositoryParsed from "../../../../../../src/validation/shared/repository/read/repository-text/read-repository-parsed.mjs";

test("uses the repository inventory parsed-content reader when available", async () => {
  const parsed = { value: true };
  const readParsed = jest.fn(async () => parsed);
  const context = { repositoryInventory: { readParsed } };
  const parse = jest.fn();
  await expect(readRepositoryParsed(context, "README.md", "markdown", parse)).resolves.toBe(parsed);
  expect(readParsed).toHaveBeenCalledWith("README.md", "markdown", parse);
  expect(parse).not.toHaveBeenCalled();
});
test("uses the repository inventory text reader before parsing", async () => {
  const readText = jest.fn(() => "plain text");
  const parse = jest.fn((text) => ({ text }));
  await expect(
    readRepositoryParsed({ repositoryInventory: { readText } }, "README.md", "markdown", parse),
  ).resolves.toEqual({ text: "plain text" });
  expect(readText).toHaveBeenCalledWith("README.md");
});
