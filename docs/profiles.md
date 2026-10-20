# Profiles

Profiles identify a repository type and select its deterministic checks.
Set the profiles in `package.json.eliware.apply`.
Eliware Test does not infer profiles from repository files.
All repositories must apply `general`.
Use `general` alone when no other profile fits.

Use this table to select profiles:

| Profile          | Select it for                                                 |
| ---------------- | ------------------------------------------------------------- |
| `general`        | Every repository.                                             |
| `documentation`  | A repository for documentation only.                          |
| `workspace`      | A private repository that contains shared workspace runbooks. |
| `library`        | A shared code library published to npm.                       |
| `application`    | The base profile for an application repository.               |
| `cli`            | An application with a command-line interface.                 |
| `web`            | An application with a web interface.                          |
| `discord`        | A Discord bot or application.                                 |
| `mcp-server`     | An MCP server application.                                    |
| `database`       | An application with database-specific requirements.           |
| `infrastructure` | A private repository that defines infrastructure.             |
| `npm-published`  | A repository that publishes an npm package.                   |
| `ghcr-published` | A repository that publishes an image to GHCR.                 |
| `private`        | A repository that has private visibility.                     |

## Follow profile combinations

Read [profile-combinations.yaml](../specs/conventions/ordering/profile-combinations.yaml) for required and prohibited profiles.
The planner rejects invalid profile lists before it discovers checks.

## Add application profiles

Apply `application` when the repository contains an application.
Add one or more application profiles for its interfaces:

- `cli` for a command-line application.
- `web` for a web application.
- `discord` for a Discord bot or application.
- `mcp-server` for an MCP server.

Read the [central policy](../specs/conventions/ordering/profile-combinations.yaml) to confirm required profiles.
You can combine these profiles when the central policy allows them.

## Add the database profile

Apply `database` when runtime code reads or writes stored data.
Read the central policy before you combine it with other profiles.

## Add publication profiles

Apply `npm-published` for npm publication rules.
Apply `ghcr-published` when GHCR image publication rules apply.
Read the central policy before you combine npm-published or ghcr-published with other profiles.
Apply `npm-published` with `application` or `library`.
An npm package must include `specs/` in `package.json.files`.
The package check runs only when `npm-published` applies.

## Add the private profile

Apply `private` to identify a private repository.
Read the [central policy](../specs/conventions/ordering/profile-combinations.yaml) to confirm when this profile is required.
Documentation repositories can apply `private`.
Read the central policy to confirm that `private` can combine with the selected profiles.

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

Include only applicable profiles.
Use `general` first.
List each required profile before the profile that requires it.

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
| Database       | None                                                                                        | [database-semantic.yaml](../specs/conventions/database-semantic.yaml)             |
| CLI            | [cli-deterministic.yaml](../specs/conventions/cli-deterministic.yaml)                       | [cli-semantic.yaml](../specs/conventions/cli-semantic.yaml)                       |
| Web            | [web-deterministic.yaml](../specs/conventions/web-deterministic.yaml)                       | [web-semantic.yaml](../specs/conventions/web-semantic.yaml)                       |
| Discord        | [discord-deterministic.yaml](../specs/conventions/discord-deterministic.yaml)               | [discord-semantic.yaml](../specs/conventions/discord-semantic.yaml)               |
| MCP server     | [mcp-server-deterministic.yaml](../specs/conventions/mcp-server-deterministic.yaml)         | [mcp-server-semantic.yaml](../specs/conventions/mcp-server-semantic.yaml)         |
| Infrastructure | [infrastructure-deterministic.yaml](../specs/conventions/infrastructure-deterministic.yaml) | [infrastructure-semantic.yaml](../specs/conventions/infrastructure-semantic.yaml) |
| npm published  | [npm-published-deterministic.yaml](../specs/conventions/npm-published-deterministic.yaml)   | [npm-published-semantic.yaml](../specs/conventions/npm-published-semantic.yaml)   |
| GHCR published | [ghcr-published-deterministic.yaml](../specs/conventions/ghcr-published-deterministic.yaml) | [ghcr-published-semantic.yaml](../specs/conventions/ghcr-published-semantic.yaml) |
| Private        | [private-deterministic.yaml](../specs/conventions/private-deterministic.yaml)               | [private-semantic.yaml](../specs/conventions/private-semantic.yaml)               |

Read the [ordering rules](../specs/conventions/ordering/README.md) for rules that use more than one profile.

[Return to documentation](README.md).
