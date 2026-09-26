import { readSection } from "./read-readme-section.mjs";

export function validateReadmeLicense(readme, sections) {
  if (
    !/^##\s+License\s*$/imu.test(readme) ||
    !/\[license\]\(LICENSE\)/iu.test(readSection(readme, "License", sections))
  ) {
    return "README.md must link the repository LICENSE file from its License section.";
  }
  return null;
}
