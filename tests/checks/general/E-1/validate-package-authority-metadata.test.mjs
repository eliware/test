import { expect, test } from "@jest/globals";
import { validatePackageAuthorityMetadata } from "../../../../src/checks/general/E-1/validate-package-authority-metadata.mjs";

const valid = { authority: { authoritativeFor: ["metadata"], notAuthoritativeFor: ["behavior"] }, crosslinks: [{ path: "../docs", relation: "relatedAuthority", authoritativeFor: "ownership" }] };

test("accepts complete authority and crosslink metadata", () => expect(validatePackageAuthorityMetadata(valid)).toBeNull());

test("requires both authority arrays to contain nonempty strings", () => {
  for (const field of ["authoritativeFor", "notAuthoritativeFor"]) {
    for (const values of [undefined, [], [""], [2]]) {
      expect(validatePackageAuthorityMetadata({ ...valid, authority: { ...valid.authority, [field]: values } })).toContain("authority");
    }
  }
});

test("requires crosslinks to provide path, relation, and authority", () => {
  for (const crosslinks of [undefined, [], [null], [{}], [{ path: "", relation: "r", authoritativeFor: "a" }], [{ path: "p", relation: "", authoritativeFor: "a" }], [{ path: "p", relation: "r", authoritativeFor: "" }]]) {
    expect(validatePackageAuthorityMetadata({ ...valid, crosslinks })).toContain("crosslinks");
  }
});
