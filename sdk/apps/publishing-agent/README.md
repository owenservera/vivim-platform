# VIVIM Publishing Agent

The **Publishing Agent** is an automated daemon service and CLI tool that utilizes the VIVIM SDK and its `AIGitIntegration` to manage system publishing.

## Features

- **Automated Publishing**: Automatically stages, commits, and pushes your codebase.
- **AI-Powered Insights**: Integrates with the VIVIM SDK `AIGitIntegration` to orchestrate localized generation of perfect, deep-context semantic commit messages explaining the rationale behind your changes.
- **Dual Flow**: Runs incrementally as a one-shot process (`publish`), or as a continuous polling daemon (`daemon`).
- **Chain Anchoring (via VIVIM SDK)**: Hooks into the distributed persistence layers (Network Engine) to anchor logic onto the ledger automatically.

## Usage

You can use the native Bun execution runtime to start the agent.

```bash
# Run a one-shot publish cycle
bun run start publish

# Run the automated polling background daemon (checks every 1 min)
bun run start daemon
```

## Architecture

The workflow leverages edge-first AI processing (via the localized Open Router or OpenAI proxies defined by `OPENAI_API_KEY`) executing a 4-step pipeline:

1. Staging (`git add .`)
2. Context Aggregation (`AIGitIntegration.gatherLocalSessionContext`)
3. Semantic Commit Generation and Anchoring (`AIGitIntegration.prepareAndAnchorCommit`)
4. Remote Synchronization (`git push origin HEAD`)

Ensure your environment defines `OPENAI_API_KEY` for semantic prompt execution if running natively inside a non-proxied container.
