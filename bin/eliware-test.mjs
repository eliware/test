#!/usr/bin/env node
import { runCli } from "../src/cli/run-cli.mjs";

const exitCode = await runCli(process.argv.slice(2));
process.exitCode = exitCode;
