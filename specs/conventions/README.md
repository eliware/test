# Repository profile specifications

These versioned profiles are the canonical local source for shared Eliware
repository requirements. The validator reads these files directly to determine
profile applicability and to report complete directives when checks fail.

## Profiles

- [application.json](application.json)
- [cli.json](cli.json)
- [discord.json](discord.json)
- [documentation.json](documentation.json)
- [fork.json](fork.json)
- [general.json](general.json)
- [ghcr-published.json](ghcr-published.json)
- [infrastructure.json](infrastructure.json)
- [library.json](library.json)
- [mcp-server.json](mcp-server.json)
- [npm-published.json](npm-published.json)
- [private.json](private.json)
- [web.json](web.json)
- [workspace.json](workspace.json)

The local authority-record format is defined in
[authority-map.json](authority-map.json). This index contains consumer-facing
profile requirements; it does not contain repository-specific maintenance
directives.

[Return to the Test specification index](../README.md).
