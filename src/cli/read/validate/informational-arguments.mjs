export function validateInformationalArguments(argumentsList) {
  if (argumentsList.includes("--help") && argumentsList.includes("--version"))
    throw new Error("--help and --version cannot be used together.");
  const informational = argumentsList.filter(
    (argument) => argument === "--help" || argument === "--version",
  );
  if (informational.length > 1)
    throw new Error("Informational commands cannot be repeated or combined.");
  if (
    informational.length > 0 &&
    argumentsList.some((argument) => !informational.includes(argument))
  )
    throw new Error("Informational commands cannot be combined with validation arguments.");
}
