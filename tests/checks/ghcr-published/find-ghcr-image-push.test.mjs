import { expect, test } from "@jest/globals";
import {
  findImagePush,
  findImagePushes,
  imageDetails,
} from "../../../src/checks/ghcr-published/find-ghcr-image-push.mjs";

test("finds only an unconditional versioned image push and derives digest identity", () => {
  const push = {
    id: "publish",
    uses: "docker/build-push-action@v6",
    with: { push: true, tags: "ghcr.io/eliware/example:v1.2.3" },
  };
  expect(
    findImagePush({
      steps: [null, { ...push, if: "always()" }, { ...push, "continue-on-error": true }, push],
    }),
  ).toBe(push);
  expect(findImagePushes({ steps: [push, { ...push, id: "pushAgain" }] })).toEqual([
    push,
    { ...push, id: "pushAgain" },
  ]);
  expect(imageDetails(push)).toEqual({
    image: "ghcr.io/eliware/example",
    tag: "ghcr.io/eliware/example:v1.2.3",
    digestReference: "${{ steps.publish.outputs.digest }}",
  });
  expect(findImagePush({})).toBeUndefined();
});

test("rejects invalid tags and step identities", () => {
  expect(
    findImagePush({
      steps: [
        { uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/x/y:latest" } },
      ],
    }),
  ).toBeUndefined();
  expect(imageDetails(undefined)).toEqual({ image: null, tag: null, digestReference: null });
  expect(imageDetails({ id: "not valid", with: { tags: "ghcr.io/x/y:v1.0.0" } })).toEqual({
    image: "ghcr.io/x/y",
    tag: "ghcr.io/x/y:v1.0.0",
    digestReference: null,
  });
});

test("uses only expression-safe GitHub step identifiers for digest references", () => {
  expect(imageDetails({ id: "_publish-1", with: { tags: "ghcr.io/x/y:v1.0.0" } })).toMatchObject({
    digestReference: "${{ steps._publish-1.outputs.digest }}",
  });
  for (const id of ["1publish", "publish.step", "publish/step", "publish step"])
    expect(imageDetails({ id, with: { tags: "ghcr.io/x/y:v1.0.0" } }).digestReference).toBeNull();
});

test("recognizes version identity when a documented latest alias shares the tag list", () => {
  const push = {
    id: "push",
    uses: "docker/build-push-action@v6",
    with: {
      push: true,
      tags: "ghcr.io/eliware/example:v1.2.3\nghcr.io/eliware/example:latest",
    },
  };
  expect(findImagePush({ steps: [push] })).toBe(push);
  expect(imageDetails(push)).toMatchObject({
    image: "ghcr.io/eliware/example",
    tag: "ghcr.io/eliware/example:v1.2.3",
  });
  const legacyNewlinePush = {
    ...push,
    with: { ...push.with, tags: "ghcr.io/eliware/example:v1.2.3\rghcr.io/eliware/example:latest" },
  };
  expect(findImagePush({ steps: [legacyNewlinePush] })).toBe(legacyNewlinePush);
});
