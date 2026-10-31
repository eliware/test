import { join } from "node:path";

export async function validateLicenseContent(root, read, expectedLicense) {
  try {
    const license = (await read(join(root, "LICENSE"), "utf8")).replace(/\s+/gu, " ").trim();
    if (license !== expectedLicense.replace(/\s+/gu, " ").trim())
      return ["LICENSE must contain the complete approved MIT text."];
    return [];
  } catch {
    return ["LICENSE could not be read."];
  }
}
