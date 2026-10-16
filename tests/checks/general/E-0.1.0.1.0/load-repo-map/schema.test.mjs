import { expect, test } from "@jest/globals";
import { loadRepoMapSchema } from "../../../../../src/checks/general/E-0.1.0.1.0/load-repo-map/schema.mjs";

const missing = () => {
  const error = new Error("not found");
  error.code = "ENOENT";
  return error;
};

test("allows a missing adjacent schema", async () => {
  await expect(
    loadRepoMapSchema("docs/repo-map.yaml", async () => {
      throw missing();
    }),
  ).resolves.toEqual({ available: false, schema: null, error: null });
});

test("reports schema read failures", async () => {
  await expect(
    loadRepoMapSchema("docs/repo-map.yaml", async () => {
      throw new Error("denied");
    }),
  ).resolves.toMatchObject({ error: "repo-map-schema.yaml could not be read: denied" });
});

test("loads one valid YAML schema document", async () => {
  await expect(
    loadRepoMapSchema("docs/repo-map.yaml", async () => "type: object\n"),
  ).resolves.toEqual({ available: true, schema: { type: "object" }, error: null });
});

test.each(["type: [\n", "type: object\n---\ntype: object\n"])(
  "reports invalid schema YAML or document count",
  async (source) => {
    await expect(
      loadRepoMapSchema("docs/repo-map.yaml", async () => source),
    ).resolves.toMatchObject({
      available: true,
      schema: null,
      error: expect.stringContaining("invalid YAML"),
    });
  },
);
