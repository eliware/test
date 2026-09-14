import { expect, test } from "@jest/globals";
import { readWorkflows } from "../../../src/checks/ghcr-published/read-workflows.mjs";

test("discovers workflow files and preserves their names and contents", async () => {
  await expect(readWorkflows(process.cwd())).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: expect.stringMatching(/\.ya?ml$/i),
        content: expect.any(String),
        document: expect.any(Object),
      }),
    ]),
  );
});
