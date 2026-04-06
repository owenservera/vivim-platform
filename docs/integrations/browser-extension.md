---
title: "Browser Extension"
description: "Capture AI conversations directly from your browser with the VIVIM browser extension."
---

# Browser Extension

The VIVIM browser extension captures AI conversations directly from your browser, no API integration needed.

## What it does

The extension automatically detects when you're using an AI provider in your browser (ChatGPT, Claude, Gemini web UI) and captures the conversation for import into VIVIM.

## Supported providers

| Provider | Web UI | Capture Method |
|---|---|---|
| **ChatGPT** | chatgpt.com | DOM scraping |
| **Claude** | claude.ai | DOM scraping |
| **Gemini** | gemini.google.com | DOM scraping |
| **Grok** | x.ai | DOM scraping |
| **Perplexity** | perplexity.ai | DOM scraping |

## Installation



<details>
<summary>Chrome</summary>

1. Open Chrome Web Store (coming soon)
    2. Search for "VIVIM Memory Capture"
    3. Click **Add to Chrome**
    4. Configure your VIVIM instance URL in extension settings

</details>

  
<details>
<summary>Firefox</summary>

1. Open Firefox Add-ons (coming soon)
    2. Search for "VIVIM Memory Capture"
    3. Click **Add to Firefox**
    4. Configure your VIVIM instance URL in extension settings

</details>

  
<details>
<summary>Manual</summary>

1. Clone the VIVIM repository
    2. Navigate to `browser-extension/`
    3. Load as unpacked extension in Chrome (`chrome://extensions/`)
    4. Configure your VIVIM instance URL

</details>


## How it works



1. **Detection**
   The extension monitors your active tab for supported AI provider domains.

  
2. **Capture**
   When it detects a conversation, it scrapes the conversation content from the page DOM.

  
3. **Queue**
   Captured conversations are queued locally in the extension's storage (IndexedDB).

  
4. **Sync**
   The extension syncs queued conversations to your VIVIM instance when you're logged in.

  
5. **Extraction**
   VIVIM processes the conversations through its standard extraction pipeline (ACU extraction, classification, embedding).


## Configuration

| Setting | Description | Default |
|---|---|---|
| **VIVIM URL** | Your VIVIM instance API URL | `http://localhost:3000` |
| **Auto-capture** | Automatically capture conversations | `true` |
| **Manual capture** | Show capture button on AI provider pages | `true` |
| **Sync interval** | How often to sync queued conversations | 5 minutes |
| **Providers** | Which providers to monitor | All supported |

## Privacy

The extension operates entirely client-side:

- **No data is sent to third parties** — only to your configured VIVIM instance
- **Local queue** — Conversations are stored in your browser's IndexedDB until synced
- **Opt-in** — You can disable auto-capture and use manual capture only
- **Transparent** — The extension is open source and auditable


::: warning
The browser extension is planned for Q3 2025. Until then, use the provider data export and import flow documented in [Data Flow: Provider Import](/architecture/data-flow#provider-import).
:::

