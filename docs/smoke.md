# Smoke test

Use the smoke command to test a package tarball in a consumer repository.
Run the command from the Eliware Test checkout or an installed package directory.

## Prepare a consumer

Use a temporary consumer copy or worktree.
Add dependencies and create a lockfile before smoke.
Use a consumer directory for the target.
Do not select the source checkout or one of its child directories.

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

Smoke saves the package files that it will replace.
It restores the package manifest, lockfiles, installed Eliware Test package, and local executable shims.
It does not restore other files that consumer tests create.
On Windows, it creates junctions from captured directory links.
It rejects captured file links before it changes files.
It does not change system-wide links or junctions.

If restore fails, the command reports the backup path.
Use that path to restore the saved files.
Do not delete the backup until you confirm recovery.

## Read smoke results

The command prints `Smoke passed` when the package install and consumer test succeed.
It prints `Tarball consumer smoke failed` when a step fails.
Smoke success does not authorize publication.

[Return to documentation](README.md).
