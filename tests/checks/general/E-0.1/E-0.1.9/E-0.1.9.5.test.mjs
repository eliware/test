import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.9/E-0.1.9.5.mjs";

test("requires crosslink authority records", async () => {
  const packageJson = {
    eliware: {
      crosslinks: [{ path: "../docs", relation: "relatedAuthority", authoritativeFor: "docs" }],
    },
  };
  expect((await run({ packageJson })).status).toBe("pass");
  expect(
    (await run({ packageJson: { eliware: { crosslinks: [{ path: "../docs" }] } } })).status,
  ).toBe("fail");
});

test.each([
  undefined,
  null,
  {},
  { crosslinks: [] },
  { crosslinks: [null] },
  { crosslinks: [{ path: "", relation: "relatedAuthority", authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: "", authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: "relatedAuthority", authoritativeFor: "" }] },
  { crosslinks: [{ path: 7, relation: "relatedAuthority", authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: 7, authoritativeFor: "docs" }] },
  { crosslinks: [{ path: "docs", relation: "relatedAuthority", authoritativeFor: 7 }] },
  {
    crosslinks: [
      { path: "/absolute.json", relation: "relatedAuthority", authoritativeFor: "docs" },
    ],
  },
  {
    crosslinks: [
      {
        path: "https://example.com/docs.json",
        relation: "relatedAuthority",
        authoritativeFor: "docs",
      },
    ],
  },
])("rejects incomplete authority crosslinks %#", async (eliware) => {
  await expect(run({ packageJson: { eliware } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("reports every malformed crosslink", async () => {
  const result = await run({
    packageJson: {
      eliware: {
        crosslinks: [
          { path: "", relation: "relatedAuthority", authoritativeFor: "docs" },
          { path: "https://example.com", relation: "relatedAuthority", authoritativeFor: "docs" },
        ],
      },
    },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("crosslinks[0]");
  expect(result.message).toContain("repository-relative");
});

test("accepts a structurally valid cross-repository authority path", async () => {
  await expect(
    run({
      packageJson: {
        eliware: {
          crosslinks: [
            {
              path: "./specs/conventions/general.json",
              relation: "relatedAuthority",
              authoritativeFor: "shared requirements",
            },
          ],
        },
      },
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "pass" }));
});
