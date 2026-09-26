import { expect, test } from "@jest/globals";
import { createBoundedSecretSearch } from "../../src/checks/create-bounded-secret-search.mjs";

test("retains secret prefixes and suppresses work after the cumulative limit", () => {
  const search = createBoundedSecretSearch(["secret"], 20, (text) => {
    const ends = Array.from({ length: text.length + 1 }, () => 0);
    const start = text.indexOf("secret");
    if (start >= 0) ends[start] = start + 6;
    return ends;
  });
  expect(search("safe secret")).toMatchObject({ boundary: 5, suppressed: false });
  expect(search("secretX")).toMatchObject({ boundary: 0, suppressed: false });
  expect(search("12345678901234567890")).toMatchObject({ boundary: 0, suppressed: true });
  const failedSearch = createBoundedSecretSearch(["a"], 100, () => null);
  expect(failedSearch("a")).toMatchObject({ suppressed: true });
});
