import { expect, test } from "@jest/globals";
import { findImagePush, imageDetails } from "../../../src/checks/ghcr-published/find-ghcr-image-push.mjs";

test("finds only an unconditional versioned image push and derives digest identity", () => {
  const push = { id: "publish", uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/eliware/example:v1.2.3" } };
  expect(findImagePush({ steps: [null, { ...push, if: "always()" }, { ...push, "continue-on-error": true }, push] })).toBe(push);
  expect(imageDetails(push)).toEqual({ image: "ghcr.io/eliware/example", tag: "ghcr.io/eliware/example:v1.2.3", digestReference: "${{ steps.publish.outputs.digest }}" });
  expect(findImagePush({})).toBeUndefined();
});

test("rejects invalid tags and step identities", () => {
  expect(findImagePush({ steps: [{ uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/x/y:latest" } }] })).toBeUndefined();
  expect(imageDetails(undefined)).toEqual({ image: null, tag: null, digestReference: null });
  expect(imageDetails({ id: "not valid", with: { tags: "ghcr.io/x/y:v1.0.0" } })).toEqual({ image: "ghcr.io/x/y", tag: "ghcr.io/x/y:v1.0.0", digestReference: null });
});
