export async function completeCliValidation({
  resultCode,
  validationError,
  releaseLock,
  reportError,
}) {
  let releaseError;
  try {
    await releaseLock();
  } catch (error) {
    releaseError = error;
  }
  if (validationError) {
    const exitCode = reportError(validationError);
    if (releaseError) reportError(releaseError);
    return exitCode;
  }
  if (releaseError) {
    const exitCode = reportError(releaseError);
    return resultCode === 0 ? exitCode : resultCode;
  }
  return resultCode;
}
