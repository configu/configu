# Configu

<a href="https://configu.com" target="_blank">
  <img align="right" src="https://raw.githubusercontent.com/configu/configu/main/assets/icon.svg" height="150px" alt="configu icon">
</a>

[**Configu**](https://configu.com/docs/) is a _simple_, _modern_, and _generic_ standard for managing and collaborating **software configurations ⚙️**. 

It is built to provide a _common_, _flexible_, and _extensible_ process for _storing_, _mutating_, and _orchestrating_ **configuration data** across different environments and systems.

[Learn how to use Configu in your project](https://configu.com/docs/get-started/).

### Documentation

You can find the Configu documentation [on the website](https://configu.com/).

> If you are new to Configu and would like to learn more, we recommend reviewing the [getting started](https://configu.com/docs/get-started/) documentation.

The documentation is divided into several sections:

* [Introduction & Overview](https://configu.com/docs/)
* [Concepts](https://configu.com/docs/terminology/)
* [CLI](https://configu.com/docs/cli-overview/)
* [SDK](https://configu.com/docs/sdk-overview/)
* [Recipes](https://configu.com/docs/webhook-slack/)

### Contributing

There are many ways to [contribute](CONTRIBUTING.md) to Configu.

* Try Configu and share your feedback with us.
* [Submit bugs](https://github.com/configu/configu/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/configu/configu/pulls).
* Engage with other Configu users and developers on [StackOverflow](https://stackoverflow.com/questions/tagged/configu).
* Help each other in the [Configu Community Discord](https://discord.com/invite/cjSBxnB9z8).
* [Contribute bugfixes and improvements](CONTRIBUTING.md).
* [Contribute documentation](https://github.com/configu/docs).

<!-- ### Roadmap

For details on our planned features and future direction please refer to our [roadmap](link-to-public-gh-project). -->

### Structure

This repository is a monorepo that contains the Configu user interface packages.

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
        coming soon
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
        coming soon
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
        coming soon
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
        coming soon
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
        coming soon
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
        coming soon
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
  </tbody>
</table>

### Related

- [The Twelve-Factor App - Config](https://12factor.net/config)
- [Wikipedia - Configuration file](https://en.wikipedia.org/wiki/Configuration_file)
- [StackOverflow - [configuration]](https://stackoverflow.com/questions/tagged/configuration)
- [DEV Community ‍- #configuration](https://dev.to/t/configuration/top/infinity)

### License

Configu is [Apache-2.0 licensed](./LICENSE).
Copyright (c) 2022-present, [Configu](https://configu.com/).
