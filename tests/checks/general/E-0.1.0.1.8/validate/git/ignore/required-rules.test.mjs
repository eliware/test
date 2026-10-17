import { expect, test } from "@jest/globals";
import { validateGitIgnoreRequiredRules } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/ignore/required-rules.mjs";

const validIgnoreText = `node_modules/\n.git/\ncoverage/\ndist/\nbuild/\ngenerated/\nartifacts/\ntest-results/\n.DS_Store\nThumbs.db`;

test("checks required rules from the repository ignore file", async () => {
  const readText = async (path, encoding) => {
    expect(path).toBe("repo/.gitignore");
    expect(encoding).toBe("utf8");
    return validIgnoreText;
  };
  await expect(validateGitIgnoreRequiredRules("repo", readText)).resolves.toEqual([]);
});

test("reports an unreadable repository ignore file", async () => {
  await expect(
    validateGitIgnoreRequiredRules("repo", async () => {
      throw new Error("denied");
    }),
  ).resolves.toEqual([".gitignore could not be read to check required ignore rules."]);
});
