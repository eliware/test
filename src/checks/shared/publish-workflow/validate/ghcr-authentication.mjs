const loginAction = "docker/login-action@v3";
const imageAction = "docker/build-push-action@v7";

export function validateGhcrAuthentication(workflow, path = "specs/workflows/ghcr.yaml") {
  const errors = [];
  const publish = workflow?.jobs?.publish;
  const steps = publish?.steps ?? [];
  const loginIndices = steps.flatMap((step, index) => (step?.uses === loginAction ? [index] : []));
  const imageIndex = steps.findIndex((step) => step?.uses === imageAction);

  if (publish?.permissions?.packages !== "write") {
    errors.push(`${path} publish job must grant packages: write.`);
  }
  if (loginIndices.length === 0) {
    errors.push(`${path} publish job must log in with ${loginAction}.`);
    return errors;
  }

  const loginsBeforeImage = loginIndices.filter((index) => imageIndex < 0 || index < imageIndex);
  const effectiveLoginIndex = loginsBeforeImage
    .filter((index) => steps[index]?.with?.registry === "ghcr.io")
    .at(-1);
  const loginIndex = effectiveLoginIndex ?? loginIndices[0];
  const login = steps[loginIndex];
  if (login?.with?.registry !== "ghcr.io") {
    errors.push(`${path} GHCR login must use registry ghcr.io.`);
  }
  if (login?.with?.username !== "${{ github.actor }}") {
    errors.push(`${path} GHCR login must use github.actor as the username.`);
  }
  if (login?.with?.password !== "${{ secrets.GITHUB_TOKEN }}") {
    errors.push(`${path} GHCR login must use secrets.GITHUB_TOKEN as the password.`);
  }
  if (imageIndex < 0 || effectiveLoginIndex === undefined) {
    errors.push(`${path} GHCR login must appear before the image push.`);
  }
  return errors;
}
