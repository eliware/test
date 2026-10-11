# Smoke test

Use the smoke command to test a package tarball in a consumer repository.
Run the command from the Eliware Test checkout or an installed package directory.

## Prepare a consumer

Use a disposable consumer copy or worktree.
Add its dependencies and create its lockfile before you run smoke.
Do not use the source checkout as the target.
Do not use a target that resolves inside the source checkout.

## Run smoke

Pass the consumer path with `--target`:

```text
npm run smoke -- --target <consumer-path>
```

The command packs the current Eliware Test package.
It installs that tarball in the consumer's local `node_modules`.
It does not save a dependency or rewrite the lockfile.
It verifies the installed package name and version.
It then runs the consumer's `npm test` command.

## Restore target files

Smoke snapshots the exact package files that it will replace.
It restores the package manifest, lockfiles, installed Eliware Test package, and local executable shims.
It does not restore other files that consumer tests create.
On Windows, it restores captured directory links as junctions.
It rejects captured file links before it changes files.
It does not change system-wide links or junctions.

If restore fails, the command reports the backup path.
Use that path to recover the saved files.
Do not delete the backup until you confirm recovery.

## Read smoke results

The command prints `Smoke passed` when the package install and consumer test pass.
It prints `Tarball consumer smoke failed` when a step fails.
Smoke success does not approve publication.

[Return to documentation](README.md).
