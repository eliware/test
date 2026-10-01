export function isGhcrImagePublicationJob(job) {
  return (
    Array.isArray(job?.steps) &&
    job.steps.some(
      (step) => step?.uses === "docker/build-push-action@v6" && step.with?.push === true,
    )
  );
}
