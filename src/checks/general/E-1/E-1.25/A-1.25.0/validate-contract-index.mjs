export function validateContractIndex(index) {
  return /\[[^\]]*contracts\.json\]\((?:\.\/)?contracts\.json(?:#[^)]*)?\)/iu.test(index)
    ? null
    : "specs/README.md must link specs/contracts.json.";
}
