# Contributing

Hi there 👋, we're excited 🤗 that you're interested in contributing to Configu! Your contributions enrich the Configu experience and make it better every day 🤩.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

We ask all contributors to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). This helps ensure a positive and productive environment for everyone.

## Reporting Issues and Asking Questions

Before opening an issue, please search the [issue tracker](https://github.com/configu/confgiu/issues) to make sure your issue hasn't already been reported.

### Bugs and Improvements

We use the issue tracker to keep track of bugs and improvements to Configu itself, its examples, and the documentation. We encourage you to open issues to discuss improvements, architecture, theory, internal implementation, etc. If a topic has been discussed before, we will ask you to join the previous discussion.

### Getting Help

**For support or usage questions like “how do I do X with Configu” and “my code doesn't work”, please search and ask on [StackOverflow with a Configu tag](https://stackoverflow.com/questions/tagged/configu?sort=votes&pageSize=50) first.**

We ask you to do this because StackOverflow has a much better job at keeping popular questions visible. Unfortunately good answers get lost and outdated on GitHub.

Some questions take a long time to get an answer. **If your question gets closed or you don't get a reply on StackOverflow for longer than a few days,** we encourage you to post an issue linking to your question. We will close your issue but this will give people watching the repo an opportunity to see your question and reply to it on StackOverflow if they know the answer.

Please be considerate when doing this as this is not the primary purpose of the issue tracker.

### Help Us Help You

On both websites, it is a good idea to structure your code and question in a way that is easy to read to entice people to answer it. For example, we encourage you to use syntax highlighting, indentation, and split text in paragraphs.

You can make it easier for us if you provide versions of the relevant libraries and a runnable small project reproducing your issue.

## Development

This repository is a [monorepo](https://trunkbaseddevelopment.com/monorepos/). This means there are multiple packages managed in this codebase, even though we publish them as separate packages.

It is powered by [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) and uses [husky] and [lint-staged] to enforce its coding guidelines. 

To see the full list of prerequisites, check out the `devEngines` property in the main [`package.json`](https://github.com/configu/configu/blob/main/package.json#L6) file.

### Repository Structure

1. The [types](types) directory contains the core types of Configu, which are declared in [TypeScript](https://www.typescriptlang.org/) and converted into strongly-typed models and serializers in multiple programming languages using [`quicktype`](https://quicktype.io/). These types serve as the foundation for Configu SDKs.
2. The [ts](ts) directory houses a sub-monorepo that includes the following packages:
   1. [ts/packages/ts](ts/packages/ts) - shared code for both the node and browser SDKs
      1. [ts/packages/ts/src/stores](ts/packages/ts/src/stores) - [ConfigStores](https://configu.com/docs/config-store/) supported for all TS based packages.
      2. [ts/packages/ts/src/commands](ts/packages/ts/src/commands) - [Commands](https://configu.com/docs/commands/) supported for all TS based packages.
   2. [ts/packages/node](ts/packages/node) - the actual node SDK
   3. [ts/packages/browser](ts/packages/browser) - the actual browser SDK
   4. [ts/packages/cli](ts/packages/cli) - Configu CLI, which is built using the node SDK
   5. [ts/packages/vscode](ts/packages/vscode) - a VSCode plugin for working with .cfgu files
3. The [py](py) directory will shortly contain the Python SDK.
4. The [examples](examples) directory demonstrate various concepts and best practices with some real-world use-cases of Configu.
5. The [documentation repository](https://github.com/configu/docs) holds the official Configu docs. Improvements to the documentation are always welcome. We use [Gatsby](https://github.com/gatsbyjs/gatsby) to build our documentation website. The website is published automatically whenever the master branch is updated.

### Sending a Pull Request

For non-trivial changes, please open an issue with a proposal for a new feature or refactoring before starting on the work. We don't want you to waste your efforts on a pull request that we won't want to accept.

On the other hand, sometimes the best way to start a conversation _is_ to send a pull request. Use your best judgement!

In general, the contribution workflow looks like this:

- Open a new issue in the [Issue tracker](https://github.com/reduxjs/redux/issues).
- Fork the repo.
- Create a new feature branch based off the `main` branch.
- Setup `monorepo` dependencies by running `npm i` in the root directory.
  - Setup specific package dependencies, for example run `cd ts; npm i`.
- Make sure all tests pass and there are no linting errors.
- Submit a pull request, referencing any issues it addresses.

Please try to keep your pull request focused in scope and avoid including unrelated commits.

After you have submitted your pull request, we'll try to get back to you as soon as possible. We may suggest some changes or improvements.

## Resources

> Working on your first Pull Request? You can learn how from this *free* series, [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

- https://opensource.guide/how-to-contribute/
- [GitHub Help](https://help.github.com)
- https://help.github.com/articles/about-pull-requests/)
- http://makeapullrequest.com/
- http://www.firsttimersonly.com/
- [JavaScript Standard Style](https://standardjs.com/)

---

Thank you 💙 for considering contributing to Configu! We look forward to working with you 🤝.
