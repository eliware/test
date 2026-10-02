import { expect, test } from "@jest/globals";
import { createBoundedSecretSearch } from "../../src/checks/create-bounded-secret-search.mjs";

test("routes non-streaming matchers to the bounded fallback strategy", () => {
  const search = createBoundedSecretSearch(["secret"], 20, (text) => {
    const ends = Array.from({ length: text.length + 1 }, () => 0);
    const start = text.indexOf("secret");
    if (start >= 0) ends[start] = start + 6;
    return ends;
  });
  expect(search("safe secret")).toMatchObject({ boundary: 5, suppressed: false });
});

test("routes streaming matchers to the incremental strategy", () => {
  const matcher = () => [];
  matcher.createStream = () => () => ({ matches: [], work: 1 });
  expect(createBoundedSecretSearch(["x"], 10, matcher)("x")).toMatchObject({
    boundary: 0,
    suppressed: false,
  });
});
