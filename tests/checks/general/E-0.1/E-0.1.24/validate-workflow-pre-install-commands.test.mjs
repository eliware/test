import { expect, test } from "@jest/globals";
import { validateWorkflowPreInstallCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-pre-install-commands.mjs";

test("allows reporting and the specific mailbox owner setup before install", () => {
  for (const command of [
    "echo starting",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\\n' > .env",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yml", [{ command }], 1)).toBeNull();
  }
});

test("rejects other setup commands before install", () => {
  for (const command of [
    "printf 'OTHER_SETTING=value\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=user@example.net\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > README.md",
    "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > .env.local",
    "printf '%s\\n' 'setup complete'",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yml", [{ command }], 1)).toContain(
      "safe setup or reporting",
    );
  }
});
