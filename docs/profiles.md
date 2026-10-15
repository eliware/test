# Profiles

Profiles classify a repository and select its deterministic checks.
Set the profiles in `package.json.eliware.apply`.
Eliware Test does not infer profiles from repository files.
Every repository must apply `general`.
Use `general` alone when no other profile fits.

## Choose one repository type

Choose one profile from this group:

- `documentation` for a repository that contains documentation only.
- `workspace` for a repository that contains operational workspaces and runbooks.
- `library` for a reusable code library.
- `application` for a runnable application.
- `infrastructure` for infrastructure code and configuration.

These repository types cannot apply together.
Each type adds rules that do not belong in `general`.

## Add application profiles

Apply `application` when the repository contains an application.
Add one or more application profiles for its interfaces:

- `cli` for a command-line application.
- `web` for a web application.
- `discord` for a Discord bot or service.
- `mcp-server` for an MCP server.

Each interface profile requires `application`.
You can combine these four profiles under `application`.

## Add the database profile

Apply `database` with `application` when runtime code reads or writes persistent data.
You can combine it with applicable interface and publication profiles.
Do not select it from repository files or package dependencies.
Do not apply it for documentation, runbooks, deployment settings, or unused packages.
Do not apply it with `library`, `documentation`, `workspace`, or `infrastructure`.

## Add publication profiles

Apply `npm-published` when npm publication rules apply.
Apply `ghcr-published` when GHCR image publication rules apply.
These profiles can apply together.
Do not apply either profile to documentation, workspace, or infrastructure repositories.
Do not combine `npm-published` with `private`.
You can combine `ghcr-published` with `private`.
An npm package must include `specs/` in `package.json.files`.
The package check runs only when `npm-published` applies.

## Add the private profile

Apply `private` to mark a private repository.
Workspace and infrastructure repositories must apply `private`.
Documentation repositories may apply `private`.
Other profile rules may limit its use.

## Use canonical order

List profiles in this order:

```text
general
documentation
workspace
library
application
database
cli
web
discord
mcp-server
infrastructure
npm-published
ghcr-published
private
```

Include only the profiles that apply.
Use `general` first.
Keep a profile before any profile that depends on it.

## Example profile lists

A documentation repository can use this list:

```json
["general", "documentation"]
```

A private workspace can use this list:

```json
["general", "workspace", "private"]
```

A CLI package published to npm can use this list:

```json
["general", "application", "cli", "npm-published"]
```

## Read profile rules

Eliware Test runs deterministic checks for selected profiles.
It does not run semantic checks.
Read the deterministic file for the exact enforced rules.
Read the semantic file for the rules that the CLI does not enforce.

| Profile        | Deterministic rules                                                                         | Semantic rules                                                                    |
| -------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| General        | [general-deterministic.yaml](../specs/conventions/general-deterministic.yaml)               | [general-semantic.yaml](../specs/conventions/general-semantic.yaml)               |
| Documentation  | [documentation-deterministic.yaml](../specs/conventions/documentation-deterministic.yaml)   | [documentation-semantic.yaml](../specs/conventions/documentation-semantic.yaml)   |
| Workspace      | [workspace-deterministic.yaml](../specs/conventions/workspace-deterministic.yaml)           | [workspace-semantic.yaml](../specs/conventions/workspace-semantic.yaml)           |
| Library        | [library-deterministic.yaml](../specs/conventions/library-deterministic.yaml)               | [library-semantic.yaml](../specs/conventions/library-semantic.yaml)               |
| Application    | [application-deterministic.yaml](../specs/conventions/application-deterministic.yaml)       | [application-semantic.yaml](../specs/conventions/application-semantic.yaml)       |
| Database       | [database-deterministic.yaml](../specs/conventions/database-deterministic.yaml)             | [database-semantic.yaml](../specs/conventions/database-semantic.yaml)             |
| CLI            | [cli-deterministic.yaml](../specs/conventions/cli-deterministic.yaml)                       | [cli-semantic.yaml](../specs/conventions/cli-semantic.yaml)                       |
| Web            | [web-deterministic.yaml](../specs/conventions/web-deterministic.yaml)                       | [web-semantic.yaml](../specs/conventions/web-semantic.yaml)                       |
| Discord        | [discord-deterministic.yaml](../specs/conventions/discord-deterministic.yaml)               | [discord-semantic.yaml](../specs/conventions/discord-semantic.yaml)               |
| MCP server     | [mcp-server-deterministic.yaml](../specs/conventions/mcp-server-deterministic.yaml)         | [mcp-server-semantic.yaml](../specs/conventions/mcp-server-semantic.yaml)         |
| Infrastructure | [infrastructure-deterministic.yaml](../specs/conventions/infrastructure-deterministic.yaml) | [infrastructure-semantic.yaml](../specs/conventions/infrastructure-semantic.yaml) |
| npm published  | [npm-published-deterministic.yaml](../specs/conventions/npm-published-deterministic.yaml)   | [npm-published-semantic.yaml](../specs/conventions/npm-published-semantic.yaml)   |
| GHCR published | [ghcr-published-deterministic.yaml](../specs/conventions/ghcr-published-deterministic.yaml) | [ghcr-published-semantic.yaml](../specs/conventions/ghcr-published-semantic.yaml) |
| Private        | [private-deterministic.yaml](../specs/conventions/private-deterministic.yaml)               | [private-semantic.yaml](../specs/conventions/private-semantic.yaml)               |

Read the [ordering rules](../specs/conventions/ordering/README.md) for rules that depend on more than one profile.

[Return to documentation](README.md).
