export async function cleanupFailedSmokeCapture(storage, fs, error) {
  try {
    await fs.rm(storage, { recursive: true, force: true });
  } catch (cleanupError) {
    throw new Error(
      `Failed to capture smoke target state (${error.message}). Temporary backup may remain at ${storage}: ${cleanupError.message}`,
      { cause: error },
    );
  }
  throw error;
}
