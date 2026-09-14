export function validateContractIndex(index) {
  return index.includes("contracts.json")
    ? null
    : "specs/README.md must link specs/contracts.json.";
}
