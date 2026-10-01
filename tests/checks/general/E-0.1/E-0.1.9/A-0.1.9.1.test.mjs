import { expect, test } from "@jest/globals";
import packageMetadata from "../../../../../package.json" with { type: "json" };
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.9/A-0.1.9.1.mjs";

const [currentMajor, currentMinor] = packageMetadata.version.split(".");
const conventionVersion = `${currentMajor}.${currentMinor}`;
const patchVersion = (patch) => `${conventionVersion}.${patch}`;

test("requires a valid package baseline and selected documents", () => {
  expect(
    run({ packageJson: { version: packageMetadata.version, eliware: { apply: ["general"] } } })
      .status,
  ).toBe("pass");
  expect(run({ packageJson: { version: "latest", eliware: { apply: ["general"] } } }).status).toBe(
    "fail",
  );
});

test.each([
  {},
  { version: packageMetadata.version },
  { version: packageMetadata.version, eliware: { apply: [] } },
  { version: packageMetadata.version, eliware: { apply: ["general", ""] } },
  { version: packageMetadata.version, eliware: { apply: ["general", 7] } },
  { version: 8, eliware: { apply: ["general"] } },
  { version: `0${currentMajor}.${currentMinor}.0`, eliware: { apply: ["general"] } },
  { version: `${packageMetadata.version}-`, eliware: { apply: ["general"] } },
  { version: `${packageMetadata.version}-alpha..1`, eliware: { apply: ["general"] } },
  { version: `v${packageMetadata.version}`, eliware: { apply: ["general"] } },
])("rejects malformed package baseline configuration %#", (packageJson) => {
  expect(run({ packageJson })).toMatchObject({ status: "fail" });
});

test.each([
  `${Number(currentMajor) - 1}.${currentMinor}.0`,
  `${currentMajor}.${Number(currentMinor) + 1}.0`,
  `${packageMetadata.version}-alpha`,
  `${packageMetadata.version}+build.1`,
])("rejects package version %s outside the current convention release sequence", (version) => {
  expect(run({ packageJson: { version, eliware: { apply: ["general"] } } })).toMatchObject({
    status: "fail",
  });
});

test.each([packageMetadata.version, patchVersion(0), patchVersion(999)])(
  "accepts patch release %s for the current convention baseline",
  (version) => {
    expect(run({ packageJson: { version, eliware: { apply: ["general"] } } })).toMatchObject({
      status: "pass",
    });
  },
);

test("rejects profiles absent from the bundled catalog", () => {
  expect(
    run({ packageJson: { version: packageMetadata.version, eliware: { apply: ["missing"] } } }),
  ).toMatchObject({ status: "fail" });
});
