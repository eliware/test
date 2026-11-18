function countCompletedPackageStages(context) {
  return Object.values(context.stageResults ?? {}).filter(
    (result) => ["pass", "warning"].includes(result.status) && result.stage !== "jest",
  ).length;
}
export default countCompletedPackageStages;
