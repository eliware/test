import { expect, jest, test } from "@jest/globals";
import { createRepositoryFileViews } from "../../src/checks/create-repository-inventory-views.mjs";

const records = [
  { path: "README.md", type: "file" },
  { path: "src/index.mjs", type: "file" },
  { path: "src/package.json", type: "file" },
  { path: "test-results/report.md", type: "file" },
  { path: "dist/bundle.mjs", type: "file" },
];

test("routes supported file-view requests through the focused selectors", async () => {
  const entries = jest.fn(async () => records);
  const views = createRepositoryFileViews(entries, null);
  await expect(views.files("all")).resolves.toContain("test-results/report.md");
  await expect(views.files("source")).resolves.toEqual(["src/index.mjs"]);
  await expect(views.files("documentation")).resolves.toContain("README.md");
  await expect(views.files("json")).resolves.toEqual(["src/package.json"]);
  await expect(views.files()).resolves.toEqual(["README.md", "src/index.mjs", "src/package.json"]);
  await expect(views.repositoryFiles()).resolves.toBe(await views.files("repository"));
  await expect(views.files("maintained")).resolves.toEqual(await views.repositoryFiles());
  expect(entries).toHaveBeenCalledTimes(6);
  await expect(views.files("unknown")).rejects.toThrow("Unknown repository inventory view");
});

test("serves explicit focused paths without discovery and falls back to repository files", async () => {
  const entries = jest.fn(async () => records);
  const focused = createRepositoryFileViews(entries, { paths: ["src/index.mjs"] });
  await expect(focused.files("focused")).resolves.toEqual(["src/index.mjs"]);
  expect(entries).not.toHaveBeenCalled();

  const unscoped = createRepositoryFileViews(entries, null);
  await expect(unscoped.focusedFiles()).resolves.toContain("README.md");
  expect(entries).toHaveBeenCalledTimes(1);
});

test("serves a scoped facade view without discovering unrelated repository files", async () => {
  const entries = jest.fn(async () => records);
  const focused = createRepositoryFileViews(entries, { paths: ["tests/one.test.mjs"] });

  await expect(focused.focusedFiles()).resolves.toEqual(["tests/one.test.mjs"]);
  expect(entries).not.toHaveBeenCalled();

  const fallback = createRepositoryFileViews(entries, { paths: [] });
  await expect(fallback.focusedFiles()).resolves.toContain("README.md");
  expect(entries).toHaveBeenCalledTimes(1);
});
