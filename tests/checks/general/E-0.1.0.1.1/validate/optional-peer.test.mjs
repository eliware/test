import { expect, test } from "@jest/globals";
import { isOptionalPeer } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/optional-peer.mjs";

test("recognizes explicit optional peer metadata", () => {
  expect(isOptionalPeer({ peerDependenciesMeta: { package: { optional: true } } }, "package")).toBe(
    true,
  );
});

test.each([undefined, null, [], {}, { optional: false }])(
  "rejects invalid or non-optional peer metadata %p",
  (details) => {
    expect(isOptionalPeer({ peerDependenciesMeta: { package: details } }, "package")).toBe(false);
  },
);
