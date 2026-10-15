import { expect, test } from "@jest/globals";
import { validateGhcrImagePushes } from "../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr-image-pushes.mjs";

const image = "${{ env.IMAGE_NAME }}";
const validPush = {
  uses: "docker/build-push-action@v6",
  with: {
    context: ".",
    file: "./Dockerfile",
    push: true,
    tags: `${image}:latest\n${image}:` + "${{ github.ref_name }}",
  },
};

test("accepts runtime image and release tags", () => {
  expect(validateGhcrImagePushes([validPush], image)).toEqual([]);
});

test("rejects invalid actions, build paths, publication conditions, and tags", () => {
  expect(
    validateGhcrImagePushes(
      [{ ...validPush, uses: "docker/build-push-action@v5", if: "false", with: { tags: "wrong" } }],
      image,
    ),
  ).toHaveLength(4);
});

test("requires at least one image push", () => {
  expect(validateGhcrImagePushes([], image)).toEqual([
    "GHCR publisher must build and push an image.",
  ]);
});

test("rejects empty and malformed additional image tags", () => {
  for (const suffix of ["", "bad:tag", "a".repeat(129)]) {
    const push = {
      ...validPush,
      with: {
        ...validPush.with,
        tags: `${image}:${suffix}\n${image}:` + "${{ github.ref_name }}",
      },
    };
    expect(validateGhcrImagePushes([push], image)).toContain(
      "GHCR image tags must use IMAGE_NAME and the release tag.",
    );
  }
});
