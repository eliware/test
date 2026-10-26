import { expect, jest, test } from "@jest/globals";
import { loadBundledConventionDocuments } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled/convention/loader.mjs";

test("loads nested convention YAML and skips profile policy files", async () => {
  const read = jest.fn(async (path) =>
    String(path).endsWith("general-deterministic.yaml")
      ? "version: '15.0'\ndescription: General.\ndirectives: []\n---\nversion: '15.0'\ndescription: More.\ndirectives: []"
      : "version: '15.0'\ndescription: Application.\ndirectives: []",
  );
  const documents = await loadBundledConventionDocuments({
    root: "/suite",
    entries: [
      { path: "specs/conventions/general-deterministic.yaml", type: "file" },
      { path: "specs/conventions/nested/application-semantic.yml", type: "file" },
      { path: "specs/conventions/ordering/profile-combinations.yaml", type: "file" },
      { path: "specs/conventions/README.md", type: "file" },
    ],
    read,
  });
  expect(documents.map(({ path }) => path)).toEqual([
    "specs/conventions/general-deterministic.yaml document 1",
    "specs/conventions/general-deterministic.yaml document 2",
    "specs/conventions/nested/application-semantic.yml document 1",
  ]);
  expect(read).toHaveBeenCalledTimes(2);
});
