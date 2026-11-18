export default function isJestPackageInstalled(requireFromConsumer, packageName) {
  try {
    requireFromConsumer.resolve(packageName);
    return true;
  } catch (error) {
    if (error?.code === "MODULE_NOT_FOUND" && error.message.includes(`'${packageName}'`))
      return false;
    throw error;
  }
}
