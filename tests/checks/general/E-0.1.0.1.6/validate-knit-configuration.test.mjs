import { expect, test } from "@jest/globals";
import { validateKnitConfiguration } from "../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration.mjs";

const deploy = (commands) =>
  `version: 1\non:\n  push:\n    deployments:\n      - cwd: /repo\n        timeoutMs: 300000\n        ${commands.replaceAll("\n", "\n        ")}\n`;

test("validates nested Knit command lists", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml", ".knit/check.mjs"],
      readText: async () =>
        deploy("commands:\n  - git pull --ff-only origin main\n  - npm ci\n  - npm test"),
    }),
  ).resolves.toEqual([]);
});

test("requires the canonical timeout and allows a repository-specific deployment path", async () => {
  const config = deploy("commands:\n  - git pull --ff-only origin main\n  - npm ci\n  - npm test");
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        config.replace("timeoutMs: 300000", "timeoutMs: 1").replace("/repo", "/srv/app"),
    }),
  ).resolves.toContain(".knit/deploy.yaml deployment 1 must set timeoutMs to 300000.");
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => config.replace("/repo", "/srv/app"),
    }),
  ).resolves.toEqual([]);
});

test("reports missing Knit inventory, unreadable files, invalid YAML, and missing deployments", async () => {
  await expect(validateKnitConfiguration()).resolves.toEqual([
    "Knit configuration could not be inspected.",
  ]);
  await expect(
    validateKnitConfiguration({
      files: async () => {
        throw new Error("inventory unavailable");
      },
      readText: async () => "",
    }),
  ).resolves.toEqual(["Knit configuration could not be inspected: inventory unavailable"]);
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => "invalid: [",
    }),
  ).resolves.toEqual(expect.arrayContaining([expect.stringContaining("could not be parsed")]));
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => "version: 1\non:\n  push:\n    deployments: {}",
    }),
  ).resolves.toContain(".knit/deploy.yaml must define push deployments.");
});

test("requires one YAML file and a commands field", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml", ".knit/extra.yaml"],
      readText: async () => deploy("commands: []"),
    }),
  ).resolves.toContain(".knit/deploy.yaml must be the only YAML file under .knit/.");
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => "version: 1\non:\n  push:\n    deployments: []",
    }),
  ).resolves.toContain(".knit/deploy.yaml must define commands fields.");
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => `${deploy("commands: []")}---\nversion: 1`,
    }),
  ).resolves.toContain(".knit/deploy.yaml must contain exactly one document.");
});

test("rejects a non-array command value", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => deploy("commands: true"),
    }),
  ).resolves.toContain(".knit/deploy.yaml commands field 1 must be an array of strings.");
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () => deploy("commands: [true]"),
    }),
  ).resolves.toContain(".knit/deploy.yaml commands field 1 must be an array of strings.");
});

test("reads a quoted on key and rejects a missing deployment file", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/other.yaml"],
      readText: async () => "version: 1",
    }),
  ).resolves.toEqual([".knit/deploy.yaml must be the only YAML file under .knit/."]);
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        deploy("commands:\n  - git pull --ff-only origin main\n  - npm ci\n  - npm test").replace(
          "on:",
          "'on':",
        ),
    }),
  ).resolves.toEqual([]);
});

test.each([
  ["git pull --ff-only origin main", "git pull origin main"],
  ["npm ci", "npm install"],
  ["npm test", "npm run test"],
])("rejects a changed required prefix command: %s", async (required, changed) => {
  const commands = ["git pull --ff-only origin main", "npm ci", "npm test"].map((command) =>
    command === required ? changed : command,
  );
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      deploy(`commands:\n${commands.map((command) => `  - ${command}`).join("\n")}`),
  });
  expect(errors.join(" ")).toContain("must begin with");
});

test.each([0, 1, 2])(
  "rejects a command list with only %i required prefix commands",
  async (count) => {
    const commands = ["git pull --ff-only origin main", "npm ci", "npm test"].slice(0, count);
    const errors = await validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        deploy(
          count === 0
            ? "commands: []"
            : `commands:\n${commands.map((command) => `  - ${command}`).join("\n")}`,
        ),
    });
    expect(errors.join(" ")).toContain("full required command prefix");
  },
);

test("rejects commands that publish images or use scripts outside .knit", async () => {
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      deploy(
        "commands: [git pull --ff-only origin main, npm ci, npm test, docker push $GHCR_IMAGE, node scripts/run.mjs]",
      ),
  });
  expect(errors.join(" ")).toContain("must not publish npm packages or GHCR images");
  expect(errors.join(" ")).toContain("must keep secondary scripts under .knit/");
});

test("allows arbitrary extra commands that do not publish npm packages or GHCR images", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        deploy(
          "commands: [git pull --ff-only origin main, npm ci, npm test, npm run validate, codescope all, docker push registry.example.com/app:latest]",
        ),
    }),
  ).resolves.toEqual([]);
});

test.each(["npm publish", "docker push ghcr.io/eliware/app:latest"])(
  "rejects publish command %s",
  async (command) => {
    const errors = await validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        deploy(`commands: [git pull --ff-only origin main, npm ci, npm test, ${command}]`),
    });
    expect(errors.join(" ")).toContain("must not publish npm packages or GHCR images");
  },
);

test("rejects alternate package managers that publish packages", async () => {
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      deploy("commands: [git pull --ff-only origin main, npm ci, npm test, pnpm publish]"),
  });
  expect(errors.join(" ")).toContain("must not publish npm packages or GHCR images");
});

test("rejects semantic release commands", async () => {
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      deploy("commands: [git pull --ff-only origin main, npm ci, npm test, npx semantic-release]"),
  });
  expect(errors.join(" ")).toContain("must not publish npm packages or GHCR images");
});

test("accepts quoted secondary script paths inside .knit", async () => {
  await expect(
    validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        deploy(
          'commands: [git pull --ff-only origin main, npm ci, npm test, node ".knit/scripts/run.mjs"]',
        ),
    }),
  ).resolves.toEqual([]);
});

test("rejects secondary script paths that escape .knit", async () => {
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      deploy(
        "commands: [git pull --ff-only origin main, npm ci, npm test, node .knit/../outside.mjs]",
      ),
  });
  expect(errors.join(" ")).toContain("must keep secondary scripts under .knit/");
});

test.each([".mts", ".cts", ".js", ".cjs", ".ts", ".sh"])(
  "rejects secondary scripts with the %s extension",
  async (extension) => {
    const errors = await validateKnitConfiguration({
      files: async () => [".knit/deploy.yaml"],
      readText: async () =>
        deploy(
          `commands: [git pull --ff-only origin main, npm ci, npm test, node .knit/scripts/run${extension}]`,
        ),
    });
    expect(errors.join(" ")).toContain("must keep secondary scripts under .knit/ and use .mjs");
  },
);

test("rejects quoted secondary script paths outside .knit", async () => {
  const errors = await validateKnitConfiguration({
    files: async () => [".knit/deploy.yaml"],
    readText: async () =>
      deploy(
        'commands: [git pull --ff-only origin main, npm ci, npm test, node "scripts/run.mjs"]',
      ),
  });
  expect(errors.join(" ")).toContain("must keep secondary scripts under .knit/");
});
