export function validateGhcrImagePushes(pushes, image) {
  const errors = [];
  if (!pushes.length) errors.push("GHCR publisher must build and push an image.");
  for (const push of pushes) {
    if (push.uses !== "docker/build-push-action@v7")
      errors.push("GHCR image builds must use docker/build-push-action v7.");
    if (
      push.with?.context !== "." ||
      push.with?.file !== "./Dockerfile" ||
      push.with?.push !== true
    )
      errors.push("GHCR image push must use the root context and root Dockerfile.");
    if (!validImageTags(push.with?.tags, image))
      errors.push("GHCR image tags must use IMAGE_NAME and the release tag.");
    if (push.if !== undefined || push["continue-on-error"] !== undefined)
      errors.push("GHCR image push steps must run unconditionally.");
  }
  return errors;
}

function validImageTags(value, image) {
  const tags = (Array.isArray(value) ? value : String(value ?? "").split(/\r?\n/u))
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  const releaseTag = `${image}:` + "${{ github.ref_name }}";
  return (
    tags.length > 0 &&
    tags.every((tag) => {
      if (tag === releaseTag) return true;
      if (!tag.startsWith(`${image}:`)) return false;
      return /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/u.test(tag.slice(image.length + 1));
    }) &&
    tags.includes(releaseTag)
  );
}
