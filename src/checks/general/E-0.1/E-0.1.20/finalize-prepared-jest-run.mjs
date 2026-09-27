function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function removeCoverage(prepared, remove, result) {
  try {
    await remove(prepared.coverageDirectory, { recursive: true, force: true });
    return { ...result, coverageDirectory: undefined };
  } catch (error) {
    return {
      ...result,
      coverageDirectory: prepared.coverageDirectory,
      cleanupError: `Could not remove run-scoped coverage artifacts: ${errorMessage(error)}`,
    };
  }
}

export function cleanupAfterPreparedJestFailure(prepared, error, remove) {
  return removeCoverage(prepared, remove, {}).then((result) => {
    if (!result.cleanupError) throw error;
    throw new Error(`${errorMessage(error)}\n${result.cleanupError}`, { cause: error });
  });
}

export async function finalizePreparedJestRun(prepared, result, retainCoverage, remove) {
  if (result.code !== 0 || result.timedOut || !retainCoverage) {
    return removeCoverage(prepared, remove, result);
  }
  return { ...result, coverageDirectory: prepared.coverageDirectory };
}
