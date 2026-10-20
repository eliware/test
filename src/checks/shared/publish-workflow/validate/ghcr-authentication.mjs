const loginAction = "docker/login-action@v3";
const imageAction = "docker/build-push-action@v7";

export function validateGhcrAuthentication(workflow, path = "specs/workflows/ghcr.yaml") {
  const errors = [];
  const publish = workflow?.jobs?.publish;
  const steps = publish?.steps ?? [];
  const loginIndex = steps.findIndex((step) => step?.uses === loginAction);
  const imageIndex = steps.findIndex((step) => step?.uses === imageAction);

  if (publish?.permissions?.packages !== "write") {
    errors.push(`${path} publish job must grant packages: write.`);
  }
  if (loginIndex < 0) {
    errors.push(`${path} publish job must log in with ${loginAction}.`);
    return errors;
  }

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
  if (imageIndex < 0 || loginIndex > imageIndex) {
    errors.push(`${path} GHCR login must appear before the image push.`);
  }
  return errors;
}
