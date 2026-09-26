import { readSection } from "./read-readme-section.mjs";

export function validateReadmeSupport(readme, sections) {
  const content = readSection(readme, "Support", sections);
  if (
    !/^##\s+Support\s*$/imu.test(readme) ||
    !/https:\/\/discord\.gg\/M6aTR9eTwN/iu.test(content) ||
    !/eliware\.org on Discord/iu.test(content)
  ) {
    return "README.md must include the standard Discord support block.";
  }
  return null;
}
