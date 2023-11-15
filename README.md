<img src="https://raw.githubusercontent.com/configu/configu/main/assets/hacktoberfest-23-banner.svg" alt="Hacktoberfest 23 Banner" />

---

<!-- # Configu -->
<p>
  <a href="https://makeapullrequest.com" target="_blank">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  </a>
  <a href="https://github.com/configu/configu/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License" />
  </a>
  <a href="https://discord.com/invite/cjSBxnB9z8" target="_blank">
    <img src="https://img.shields.io/discord/919659746003410944?logo=discord&logoColor=white&label=Chat&color=7289da" alt="Chat Discord" />
 </a>
</p>

<a href="https://configu.com" target="_blank">
  <img align="right" src="https://raw.githubusercontent.com/configu/configu/main/assets/icon.svg" height="150px" alt="Configu Icon">
</a>

**Configu** is a _simple_, _modern_, and _secure_ standard for managing and collaborating **software configurations ⚙️**.

It is built to provide a _common_, _flexible_, and _extensible_ process for storing, mutating, and orchestrating **configuration data** across different environments and systems.

[Learn how to use Configu in your project](https://configu.com/docs/get-started/).

### Features

Configu isn’t just a tool; it’s a dedicated companion on your software development journey. Its features are tailored to ensure that your configurations are not just managed but are an integral, secure, and optimized part of your software lifecycle. [Try Configu](https://configu.com/docs/get-started/) and transform the way you handle software configurations.

🎯 **Simple**: Offers a unified API for all configuration tasks, whether dealing with files, databases, secret managers, or custom implementations. Enables end-to-end configuration automation throughout the software development lifecycle.

🚀 **Modern**: Expertly manages configuration data across multiple deployments, workflows, runtimes, and environments. Scales to accommodate infinite configuration contexts, maintaining seamless management and organization.

🔒 **Secure**: Equipped with a robust configuration type system and a comprehensive policy framework. Provides built-in safeguards against application misconfigurations, ensuring a secure environment for your configurations.

🌐 **Common**: Promotes a clear understanding and consistent management of configuration data. Facilitates collaboration and ensures configurations are accurate and up-to-date. Provides a declarative approach that integrates seamlessly with coding tasks, enabling "Learn Once, Write Anywhere" flexibility and automation across diverse environments and systems.

🌟 **Flexible**: Adapts to any modern tech stack and use case. Allows to manage configurations across files, directories, codebases, and repositories. Accommodates configuration values over a context tree for inheritance and advanced overriding. Allows combining and piping commands to produce any necessary configuration artifact.

🛠 **Extensible**: Supports custom configuration storage implementations, configuration formatters, and injectors. Continuously evolving and driven by community contributions.

Configu is more than just a tool; it’s a solution that evolves with you, enhancing the way you think and interact with software configurations.

### Concepts

<img alt="Config" height="24" width="24" align="absmiddle" src="https://raw.githubusercontent.com/configu/configu/main/assets/concepts/Config.svg"> **Config**: A generic representation of `application configuration` using three properties: `key`, `value`, `set`. <a href="https://github.com/configu/configu/blob/main/types/Config.ts" target="_blank">types/Config</a>

<img alt="Cfgu" height="24" width="24" align="absmiddle" src="https://raw.githubusercontent.com/configu/configu/main/assets/concepts/ConfigSchema.svg"> **Cfgu**: A generic declaration of a `Config`, using properties like type, description and constraints. <a href="https://github.com/configu/configu/blob/main/types/Cfgu.ts" target="_blank">types/Cfgu</a>

<img alt="ConfigStore" height="24" width="24" align="absmiddle" src="https://raw.githubusercontent.com/configu/configu/main/assets/concepts/ConfigStore.svg"> **ConfigStore**: A storage engine interface for `Config`s records. <a href="https://github.com/configu/configu/blob/main/types/ConfigStore.ts" target="_blank">types/ConfigStore</a>

<img alt="ConfigSet" height="24" width="24" align="absmiddle" src="https://raw.githubusercontent.com/configu/configu/main/assets/concepts/ConfigSet.svg"> **ConfigSet**: A unique path within a tree-like data structure that groups `Config`s contextually. <a href="https://github.com/configu/configu/blob/main/types/ConfigSet.ts" target="_blank">types/ConfigSet</a>

<img alt="ConfigSchema" height="24" width="24" align="absmiddle" src="https://raw.githubusercontent.com/configu/configu/main/assets/concepts/ConfigSchema.svg"> **ConfigSchema**: A file containing binding records linking each unique `ConfigKey` to its corresponding `Cfgu` declaration. <a href="https://github.com/configu/configu/blob/main/types/ConfigSchema.ts" target="_blank">types/ConfigSchema</a>

⤴️ **Upsert Command**: Create, update or delete `Configs` from a `ConfigStore`. <a href="https://github.com/search?q=repo%3Aconfigu%2Fconfigu+Upsert+Command&type=code" target="_blank">Search Upsert Command</a>

⤵️ **Eval Command**: Fetch `Configs` from `ConfigStore` on demand. <a href="https://github.com/search?q=repo%3Aconfigu%2Fconfigu+Eval+Command&type=code" target="_blank">Search Eval Command</a>

▶️ **Export Command**: Export `Configs` as configuration data in various modes. <a href="https://github.com/search?q=repo%3Aconfigu%2Fconfigu+Export+Command&type=code" target="_blank">Search Export Command</a>

### Architecture

Configu's architecture is designed to seamlessly integrate into the software development lifecycle. The flow diagram below illustrates this dynamic process:

<img src="https://raw.githubusercontent.com/configu/configu/main/assets/flow-diagram.svg" alt="Configu Flow Diagram" />

The Configu workflow is an iterative process that boosts configuration management as a regular part of your development cycle:

1. **Define ConfigSchema**: Regularly define and revise configuration instances form code sections using `ConfigSchema`.

2. **Synchronize with VCS**: Keep these `ConfigSchema` updated with your code in your Version Control System (VCS). This ensures configurations evolve with your application.

3. **Upsert Configurations**: Use `ConfigSchema` with a `ConfigSet` to `Upsert` (updates or inserts) `Config`s into a `ConfigStore`. Use the context tree. Any modified `Config` is validated against the `ConfigSchema`.

4. **Evaluate Configurations**: From development to deployment, use `ConfigSchema` and `ConfigSet` to `Evaluate` `Configs` from a `ConfigStore`. Any fetched `Config` is validated against the `ConfigSchema`.

5. **Export Configurations for Use**: After evaluation, `Export` the `Configs` into formats needed for your application. This step adapts to various deployment environments and needs. Utilize the `CLI` for build and deploy time operations, and the `SDK`s for runtime operations.

Incorporating these steps into your regular development routines, Configu fosters a dynamic and integrated approach to configuration management. This ensures that configurations remain in sync with your application's evolution, bolstering the system's stability and reliability, as well as enhancing team efficiency and productivity.

### Documentation

You can find the Configu documentation [on the website](https://configu.com/).
The documentation is divided into several sections:

* [Introduction & Overview](https://configu.com/docs/)
* [Concepts](https://configu.com/docs/terminology/)
* [CLI](https://configu.com/docs/cli-overview/)
* [SDK](https://configu.com/docs/sdk-overview/)

### Contributing

There are many ways to [contribute](https://github.com/configu/configu/blob/main/CONTRIBUTING.md) to Configu.

* Try Configu and [share your feedback](https://github.com/configu/configu/issues/265) with us.
* [Submit bugs](https://github.com/configu/configu/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/configu/configu/pulls).
* Engage with other Configu users and developers on [StackOverflow](https://stackoverflow.com/questions/tagged/configu).
* Help each other in the [Discord community](https://discord.com/invite/cjSBxnB9z8).
* [Contribute bugfixes and improvements](https://github.com/configu/configu/blob/main/CONTRIBUTING.md).
* [Contribute documentation](https://github.com/configu/docs).

<!-- ### Roadmap

For details on our planned features and future direction please refer to our [roadmap](link-to-public-gh-project). -->

### Structure

<table>
  <thead>
    <tr>
      <th>Interface</th>
      <th>Version</th>
      <th>Setup</th>
      <th>Code</th>
      <th>Build</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <img alt="Bash" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/bash-icon.svg">
        <strong>Configu CLI</strong>
      </td>
      <td>
        <a href="https://cli.configu.com/channels/stable/configu-linux-x64-buildmanifest"> 
          <img alt="cli version" src="https://img.shields.io/badge/dynamic/json?color=%230066F5&label=%40configu%2Fcli&prefix=v&logo=windowsterminal&query=version&url=https%3A%2F%2Fcli.configu.com%2Fchannels%2Fstable%2Fconfigu-linux-x64-buildmanifest">
        </a>
      </td>
      <td>
        <a href="https://configu.com/docs/cli-setup/" target="_blank">Instructions</a>
      </td>
      <td>
        <a href="ts/packages/cli" target="_blank">ts/packages/cli</a>
      </td>
      <td>
        <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-cli.yml?label=CD&logo=githubactions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Node.js" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/nodejs-icon.svg">
        <strong>Node.js SDK</strong>
      </td>
      <td>
        <a href="https://www.npmjs.com/package/@configu/node" target="_blank"> 
          <img alt="npm" align="absmiddle" src="https://img.shields.io/npm/v/@configu/node?color=%230066F5&label=%40configu%2Fnode&logo=npm">
        </a>
      </td>
      <td>
        <a href="ts/packages/node/README.md#install" target="_blank">Instructions</a>
      </td>
      <td>
        <a href="ts/packages/node" target="_blank">ts/packages/node</a>
      </td>
      <td>
        <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-ts.yml?label=CD&logo=githubactions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Internet Explorer" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/internetexplorer.svg">
        <strong>Browser SDK</strong>
      </td>
      <td>
        <a href="https://www.npmjs.com/package/@configu/browser" target="_blank"> 
          <img alt="npm" align="absmiddle" src="https://img.shields.io/npm/v/@configu/browser?color=%230066F5&label=%40configu%2Fbrowser&logo=npm">
        </a>
      </td>
      <td>
        <a href="ts/packages/browser/README.md#install" target="_blank">Instructions</a>
      </td>
      <td>
        <a href="ts/packages/browser" target="_blank">ts/packages/browser</a>
      </td>
      <td>
        <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-ts.yml?label=CD&logo=githubactions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Python" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/python.svg">
        <strong>Python SDK</strong>
      </td>
      <td>
        <a href="https://pypi.org/project/configu/" target="_blank"> 
          <img alt="pypi" align="absmiddle" src="https://img.shields.io/pypi/v/configu?color=%230066F5&label=%40configu%2Fpy&logo=pypi">
        </a>
      </td>
      <td>
        <a href="py/README.md#install" target="_blank">Instructions</a>
      </td>
      <td>
        <a href="py" target="_blank">py</a>
      </td>
      <td>
        <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-py.yml?label=CD&logo=githubactions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Java" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/java.svg">
        <strong>Java SDK</strong>
      </td>
      <td>
        <img alt="coming-soon label" align="absmiddle" src="https://img.shields.io/badge/coming-soon-yellow">
      </td>
      <td>
        <!-- <a href="https://configu.com/docs/java-sdk-setup/" target="_blank">Instructions</a> -->
      </td>
      <td>
        <!-- <a href="java" target="_blank">java</a> -->
      </td>
      <td>
        <!-- <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-java.yml?label=CD&logo=githubactions&logoColor=white"> -->
      </td>
    </tr>
    <tr>
      <td>
        <img alt=".NET" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/dotnet.svg">
        <strong>.NET SDK</strong>
      </td>
      <td>
        <img alt="coming-soon label" align="absmiddle" src="https://img.shields.io/badge/coming-soon-yellow">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="C++" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/c-plusplus.svg">
        <strong>C++ SDK</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="PHP" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/php.svg">
        <strong>PHP SDK</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Go" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/go.svg">
        <strong>Go SDK</strong>
      </td>
      <td>
        <a href="https://pkg.go.dev/github.com/configu/configu/go" target="_blank"> 
          <img alt="go" align="absmiddle" src="https://img.shields.io/github/v/tag/configu/configu?filter=go-&color=%230066F5&label=%40configu%2Fgo&logo=github">
        </a>
      </td>
      <td>
        <a href="go/README.md#install" target="_blank">Instructions</a>
      </td>
      <td>
        <a href="go" target="_blank">go</a>
      </td>
      <td>
        <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-go.yml?label=CD&logo=githubactions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Rust" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/rust.svg">
        <strong>Rust SDK</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Ruby" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/ruby.svg">
        <strong>Ruby SDK</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Visual Studio Code" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/visual-studio-code.svg">
        <strong>VSCode Extension</strong>
      </td>
      <td>
        <img alt="coming-soon label" align="absmiddle" src="https://img.shields.io/badge/coming-soon-yellow">
        <!-- <a href="https://github.com/configu/configu/releases?q=vscode&expanded=true" target="_blank"> 
          <img alt="npm (scoped)" align="absmiddle" src="https://img.shields.io/npm/v/@configu/browser?color=%230066F5&label=%40configu%2Fbrowser&logo=github">
        </a> -->
      </td>
      <td>
        <!-- <a href="https://configu.com/docs/vscode-ext-setup/" target="_blank">Instructions</a> -->
      </td>
      <td>
        <a href="ts/packages/vscode" target="_blank">ts/packages/vscode</a>
      </td>
      <td>
        <img alt="GitHub Workflow Status" align="absmiddle" src="https://img.shields.io/github/actions/workflow/status/configu/configu/cd-vscode.yml?label=CD&logo=githubactions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td>
        <img alt="IntelliJ IDEA" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/intellij-idea.svg">
        <strong>IntelliJ Plugin</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Kubernetes" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/kubernetes.svg">
        <strong>Kubernetes Operators</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
    <tr>
      <td>
        <img alt="Terraform" height="24" width="24" align="absmiddle" src="https://cdn.svgporn.com/logos/terraform-icon.svg">
        <strong>Terraform Provider</strong>
      </td>
      <td>
        <img alt="help-wanted label" align="absmiddle" src="https://img.shields.io/badge/help-wanted-pink">
      </td>
      <td>
      </td>
      <td>
      </td>
      <td>
      </td>
    </tr>
  </tbody>
</table>

### Related

- [Configu Blog](https://configu.com/blog/)
- [The Twelve-Factor App - Config](https://12factor.net/config)
- [Wikipedia - Configuration file](https://en.wikipedia.org/wiki/Configuration_file)
- [StackOverflow - [configuration]](https://stackoverflow.com/questions/tagged/configuration)
- [DEV Community ‍- #configuration](https://dev.to/t/configuration/top/infinity)
- [Webinar - Configuration-as-Code (CaC)](https://www.youtube.com/live/Z_Vz8v6e-U4?si=bDao_gIo1xiLDeQS&t=107)
- [Post - Configuration-as-Code (CaC)](https://dev.to/rannn505/configuration-as-code-automating-application-configuration-45k6)

### License

Configu is [Apache-2.0 licensed](https://github.com/configu/configu/blob/main/LICENSE).
Copyright (c) 2022-present, [Configu](https://configu.com/).
