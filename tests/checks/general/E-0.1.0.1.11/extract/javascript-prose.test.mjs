import { expect, test } from "@jest/globals";
import { extractJavaScriptProse } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose.mjs";

test("checks comments, visible JSX text, and user-facing JSX attributes", () => {
  const source = [
    "// Choose a valid option.",
    '<main title="Set a clear title" aria-label="Select a record">',
    "  <p>Show the selected record.</p>",
    '  <input placeholder="Enter a valid name" alt="Show the image" />',
    '  <label title={"Set an accessible title"}>Name</label>',
    '  <span className="internal state" data-event="recordChanged">Hidden data</span>',
    "</main>;",
  ].join("\n");
  const blocks = extractJavaScriptProse(source);
  expect(blocks.map(({ text }) => text.trim())).toEqual([
    "Choose a valid option.",
    "Set a clear title",
    "Select a record",
    "Show the selected record.",
    "Enter a valid name",
    "Show the image",
    "Set an accessible title",
    "Name",
    "Hidden data",
  ]);
});

test("checks supported CLI, dialog, DOM, and Discord output contexts", () => {
  const source = [
    'console.error("Enter a valid name.");',
    "console.info(`Select a record for ${name}.`);",
    'process.stdout.write("Choose a valid option.");',
    'process.stderr.write("The request failed.");',
    'readline.question("Enter a search term.");',
    'window.confirm("Remove this saved item?");',
    'interaction.reply("The request failed.");',
    'interaction.followUp("Choose another option.");',
    'interaction.editReply("The request is complete.");',
    'element.textContent = "Show the current value.";',
    'document.title = "Account settings";',
    'element.setAttribute("aria-label", "Open account settings");',
    'connection.query("SELECT name FROM users");',
    'reply.header("content-security-policy", "default-src none");',
    'element["textContent"] = "Show an accessible value.";',
  ].join("\n");
  expect(extractJavaScriptProse(source).map(({ text }) => text)).toEqual([
    "Enter a valid name.",
    "Choose a valid option.",
    "The request failed.",
    "Enter a search term.",
    "Remove this saved item?",
    "The request failed.",
    "Choose another option.",
    "The request is complete.",
    "Show the current value.",
    "Account settings",
    "Open account settings",
    "Show an accessible value.",
  ]);
});

test("skips machine strings, templates, regular expressions, and non-user-facing attributes", () => {
  const source = [
    'const css = ".item { color: red; }";',
    'const selector = ".menu-item:hover";',
    'const sql = "SELECT name FROM users";',
    'const header = "content-security-policy: default-src none";',
    'const eventName = "recordChanged";',
    'const transform = "rotate(90) translate(2, 3)";',
    'const source = `self.addEventListener("fetch", handler);`;',
    "const expression = /select a value/iu;",
    'const button = <button className="Set a label" data-label="Choose a value">Save now</button>;',
  ].join("\n");
  expect(extractJavaScriptProse(source).map(({ text }) => text.trim())).toEqual(["Save now"]);
});

test("skips dynamic template output", () => {
  expect(extractJavaScriptProse("console.log(`Choose a value for ${name}.`);")).toEqual([]);
});

test("skips invalid source because lint reports parse errors", () => {
  expect(extractJavaScriptProse("const =")).toEqual([]);
});
