import { compatibleWithNode26 } from "../../general/E-1/validate-package-runtime.mjs";

export function validatePublicationMetadata(packageJson) {
  if (typeof packageJson?.engines?.node !== "string" || !compatibleWithNode26(packageJson.engines.node.trim())) {
    return "Public npm packages must declare Node.js 26 compatibility.";
  }
  if (packageJson?.publishConfig?.provenance !== true) {
    return "Public npm packages must enable npm provenance.";
  }
  const files = packageJson?.files;
  const required = ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"];
  if (
    !Array.isArray(files) ||
    !required.every((value) => files.includes(value) || files.includes(value.slice(0, -1)))
  ) {
    return "Public npm packages must provide a files allowlist containing README.md, LICENSE, RELEASE_NOTES.md, docs/, specs/.";
  }
  if (packageJson?.scripts?.pack !== "eliware-test --pack") {
    return "Public npm packages must define pack=eliware-test --pack.";
  }
  return null;
}
