import { expect, test } from "@jest/globals";
import { validateGhcrImagePushes } from "../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr-image-pushes.mjs";

const image = "ghcr.io/eliware/example";
const validPush = {
  uses: "docker/build-push-action@v6",
  with: {
    context: ".",
    file: "./Dockerfile",
    push: true,
    tags: `${image}:latest\n${image}:v1.2.3`,
  },
};

test("accepts package-derived tags with the exact package version", () => {
  expect(validateGhcrImagePushes([validPush], image, "1.2.3")).toEqual([]);
});

test("rejects invalid actions, build paths, publication conditions, and tags", () => {
  expect(
    validateGhcrImagePushes(
      [{ ...validPush, uses: "docker/build-push-action@v5", if: "false", with: { tags: "wrong" } }],
      image,
      "1.2.3",
    ),
  ).toHaveLength(4);
});

test("requires at least one image push", () => {
  expect(validateGhcrImagePushes([], image, "1.2.3")).toEqual([
    "GHCR publisher must build and push an image.",
  ]);
});

test("rejects empty and malformed additional image tags", () => {
  for (const suffix of ["", "bad:tag", "a".repeat(129)]) {
    const push = {
      ...validPush,
      with: { ...validPush.with, tags: `${image}:${suffix}\n${image}:v1.2.3` },
    };
    expect(validateGhcrImagePushes([push], image, "1.2.3")).toContain(
      "GHCR image tags must use one package-derived name and the exact v-prefixed version.",
    );
  }
});
