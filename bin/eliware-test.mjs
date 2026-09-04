#!/usr/bin/env node

import { runCli } from '../src/application/cli-entrypoint.mjs';

process.exitCode = await runCli(process.argv.slice(2));
