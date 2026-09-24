import { expect, test } from "@jest/globals";
import { validateReadmeLicense } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-license.mjs";

test("requires the repository LICENSE link under License", () => {
  expect(validateReadmeLicense("## License\n[license](LICENSE)")).toBeNull();
  expect(validateReadmeLicense("## License\nMIT")).toContain("repository LICENSE file");
  expect(validateReadmeLicense("## Links\n[license](LICENSE)")).toContain(
    "repository LICENSE file",
  );
});
