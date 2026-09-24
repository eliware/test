import { expect, test } from "@jest/globals";
import { findDigestInspection, findVersionTagDigestVerification } from "../../../src/checks/ghcr-published/find-ghcr-digest-verification.mjs";

const details = { image: "ghcr.io/eliware/example", tag: "ghcr.io/eliware/example:v1.2.3", digestReference: "${{ steps.publish.outputs.digest }}" };

test("matches exact digest inspection and version-tag digest verification commands", () => {
  const inspection = `docker buildx imagetools inspect ${details.image}@${details.digestReference}`;
  const verification = `test "$(docker buildx imagetools inspect ${details.tag} --format '{{.Manifest.Digest}}')" = "${details.digestReference}"`;
  expect(findDigestInspection({ steps: [{ run: inspection }] }, details).run).toBe(inspection);
  expect(findVersionTagDigestVerification({ steps: [{ run: verification }] }, details).run).toBe(verification);
});

test("rejects conditional and inexact digest commands", () => {
  expect(findDigestInspection({ steps: [{}, { if: "always()", run: `docker buildx imagetools inspect ${details.image}@${details.digestReference}` }] }, details)).toBeUndefined();
  expect(findDigestInspection({}, details)).toBeUndefined();
  expect(findVersionTagDigestVerification({ steps: [{}, { run: "test false" }] }, details)).toBeUndefined();
});
