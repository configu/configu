# @configu/configu

Integrates the Configu Orchestrator with [Configu platform](https://configu.com).

The Configu Platform is the most innovative store purpose-built for configurations. It is built based on the Configu configuration-as-code (CaC) approach and can model configurations and wrap them with unique layers, providing collaboration capabilities, visibility into configuration workflows, and security and compliance standardization.

Unlike legacy tools, which treat configurations as unstructured data or key-value pairs, Configu is leading the way with a Configuration-as-Code approach. By modeling configurations, they are treated as first-class citizens in the developers’ code. This makes our solution more robust and reliable and also enables Configu to provide more capabilities, such as visualization, a testing framework, and security abilities.

- Name: Configu
- Category: Configu

## Configuration

The Configu Orchestrator requires authorization to access your Configu organization. If you’re using the Configu CLI, simply run `configu login` to start an interactive login session. This will authenticate you with Configu ConfigStore and securely store your credentials for future use—no additional steps needed. Otherwise, you need to supply the following credentials:

- `credentials.org` - The organization identifier of the organization your want to use.
- `credentials.token` - [A token you generated via the Configu platform.](https://docs.configu.com/integrations/store/configu/tokens)

You may optionally a tag to evaluate your configs with a [specific snapshot of any existing tags](https://docs.configu.com/integrations/store/configu/config-history#evaluating-with-a-tag) to ensure your evaluations are deterministic via the `tag` parameter.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: configu
    configuration:
      credentials:
        org: my-org
        token: my-token
      tag: v1.0.0
```

### CLI examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hello" \
    -c "SUBJECT=configu"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Platform features

Configu Platform complements the [Configu OSS](https://github.com/configu/configu) management by providing:

- [A Single Source Of Truth](/integrations/store/configu/config-explorer) - with an easy way to explore and modify configurations
- **E2E Testing** - beyond the `Configu OSS` extensive test framework, `Configu Platform` adds a logic test layer that tests the big picture
- [History & Versioning](/integrations/store/configu/config-editor) - records configuration changes, making it easy to revert if needed
- [Activity Log](/integrations/store/configu/audit-logs) - record all actions that happen through Configu allowing for better collaboration
- [Webhooks](/integrations/store/configu/webhooks) - integrates with practically any 3rd-party tool or platform and enables push events
- [Integrations](/integrations/store/configu/integrations) - integrate with 3rd-party providers to enable features in the Configu Cloud
- [Permissions](/integrations/store/configu/members) - invite team members and control their permissions
- [Tokens](/integrations/store/configu/tokens) - enable other tools to integrate into Configu and manage configurations
- **Security** - increase your security and provide compliance standardization
- [Authorization](/integrations/store/configu/authorization) - control who can access what in the Configu Platform

![image](https://raw.githubusercontent.com/configu/configu/refs/heads/main/docs/images/configu-cloud.png)
