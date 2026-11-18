export default function formatSmokeCleanupFailure(error) {
  return `Temporary smoke cleanup failed: ${error.message}.`;
}
