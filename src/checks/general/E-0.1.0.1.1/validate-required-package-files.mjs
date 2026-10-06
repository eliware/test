import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const requiredFiles = [
  "package.json",
  "package-lock.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "specs/README.md",
];
const expectedLicense = `MIT License

Copyright (c) 2026 Eliware

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export async function validateRequiredPackageFiles(root, { getStat = stat, read = readFile } = {}) {
  const errors = [];
  for (const file of requiredFiles) {
    try {
      if (!(await getStat(join(root, file))).isFile()) errors.push(`${file} must be a file.`);
    } catch {
      errors.push(`${file} is required at the repository root.`);
    }
  }
  try {
    const license = (await read(join(root, "LICENSE"), "utf8")).replace(/\s+/gu, " ").trim();
    if (license !== expectedLicense.replace(/\s+/gu, " ").trim())
      errors.push("LICENSE must contain the complete approved MIT text.");
  } catch {
    errors.push("LICENSE could not be read.");
  }
  return errors;
}
