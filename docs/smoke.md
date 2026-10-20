# Smoke test

Use the smoke command to test a package tarball in a consumer repository.
Run the command from the Eliware Test checkout or an installed package directory.

## Prepare a consumer

Smoke operates on the target repository that you select.
If you want isolation, use a temporary consumer worktree.
Install the consumer dependencies and create its lockfile before smoke.
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

It creates a temporary pack and backup folder in the Eliware Test checkout.
It removes that folder after a restore when its identity is unchanged.
It retains recovery data when it cannot restore the target.
It leaves the temporary folder untouched when it cannot verify its identity.

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
Smoke success does not publish the package or authorize publication.

[Return to documentation](README.md).
