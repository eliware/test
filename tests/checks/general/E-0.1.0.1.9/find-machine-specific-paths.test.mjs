import { expect, test } from "@jest/globals";
import { findMachineSpecificPaths } from "../../../../src/checks/general/E-0.1.0.1.9/find-machine-specific-paths.mjs";

test("scans all supplied paths and ignores labels, hosts, and file URLs", async () => {
  const contents = new Map([
    [
      "clean.txt",
      Buffer.from("eliware-internal private.eliware.org file://private/path /var/lib/service"),
    ],
    ["path.txt", Buffer.from(["", "home", "eli", "project"].join("/"))],
  ]);
  await expect(
    findMachineSpecificPaths([...contents.keys()], async (path) => contents.get(path)),
  ).resolves.toEqual(["path.txt"]);
});

test("skips invalid UTF-8 and NUL bytes but scans other valid UTF-8 control characters", async () => {
  const contents = new Map([
    ["invalid.txt", Buffer.from([0xff, 0xfe])],
    [
      "binary.txt",
      Buffer.concat([Buffer.from(["", "home", "eli", "project"].join("/")), Buffer.from([0])]),
    ],
    ["control.txt", Buffer.from(`${["", "home", "eli", "project"].join("/")}\u0001`, "utf8")],
  ]);
  await expect(
    findMachineSpecificPaths([...contents.keys()], async (path) => contents.get(path)),
  ).resolves.toEqual(["control.txt"]);
});

test("does not treat application routes as machine paths", async () => {
  const contents = new Map([["routes.txt", Buffer.from("/admin/app/users/:id /api/users/me")]]);
  await expect(
    findMachineSpecificPaths([...contents.keys()], async (path) => contents.get(path)),
  ).resolves.toEqual([]);
});

test("allows standard Linux container accounts and mount paths", async () => {
  const contents = new Map([
    [
      "container-paths.txt",
      Buffer.from(
        [
          ["", "home", "node", ".cache", "puppeteer"].join("/"),
          ["", "home", "argocd", ".config", "sops", "age", "keys.txt"].join("/"),
          ["", "home", "runner", "_work"].join("/"),
          `\`${["", "srv", "repository"].join("/")}\``,
          `\`${["", "srv", "workspace"].join("/")}\``,
        ].join(" "),
      ),
    ],
  ]);
  await expect(
    findMachineSpecificPaths([...contents.keys()], async (path) => contents.get(path)),
  ).resolves.toEqual([]);
});
