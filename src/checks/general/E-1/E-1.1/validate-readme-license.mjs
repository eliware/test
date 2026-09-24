import { readSection } from "./read-readme-section.mjs";

export function validateReadmeLicense(readme) {
  if (
    !/^##\s+License\s*$/imu.test(readme) ||
    !/\[license\]\(LICENSE\)/iu.test(readSection(readme, "License"))
  ) {
    return "README.md must link the repository LICENSE file from its License section.";
  }
  return null;
}
