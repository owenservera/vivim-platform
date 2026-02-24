/**
 * Z.AI MCP Service
 *
 * Provides MCP tool capabilities to VIVIM users:
 * - Web Search (!websearch)
 * - Web Reader (!read)
 * - GitHub/Zread (!github)
 * - Vision (!vision) - handled separately
 *
 * Uses Z.AI API key from environment (ZAI_API_KEY)
 */

import { logger } from '../lib/logger.js';

const { ZAI_API_KEY } = process.env;
const ZAI_BASE_URL = 'https://api.z.ai/api/mcp';

// MCP Server endpoints
const MCP_ENDPOINTS = {
  webSearch: 'https://api.z.ai/api/mcp/web_search_prime/mcp',
  webReader: 'https://api.z.ai/api/mcp/web_reader/mcp',
  zread: 'https://api.z.ai/api/mcp/zread/mcp',
};

/**
 * Make MCP request to Z.AI
 */
async function mcpRequest(endpoint, toolName, params) {
  if (!ZAI_API_KEY) {
    throw new Error('Z.AI API key not configured. Set ZAI_API_KEY environment variable.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ endpoint, status: response.status, error }, 'Z.AI MCP request failed');
    throw new Error(`Z.AI MCP error: ${response.status} ${error}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    let result = '';
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.result?.content?.[0]?.text) {
              result = parsed.result.content[0].text;
            } else if (parsed.error?.message) {
              throw new Error(parsed.error.message);
            }
          } catch (e) {
            // Continue
          }
        }
      }
    }

    try {
      return JSON.parse(result);
    } catch {
      return { content: [{ text: result }] };
    }
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Z.AI MCP error: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Web Search - Search the web for information
 * Usage: !websearch <query>
 */
export async function webSearch(query) {
  logger.info({ query }, 'Z.AI Web Search');

  const result = await mcpRequest(MCP_ENDPOINTS.webSearch, 'webSearchPrime', {
    search_query: query,
  });

  // Parse and format results
  const searchResults = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;

  return {
    tool: 'websearch',
    query,
    results: searchResults.results || [],
    count: searchResults.results?.length || 0,
  };
}

/**
 * Web Reader - Fetch and parse webpage content
 * Usage: !read <url>
 */
export async function webRead(url) {
  logger.info({ url }, 'Z.AI Web Reader');

  const result = await mcpRequest(MCP_ENDPOINTS.webReader, 'webReader', {
    url,
    include_content: true,
  });

  // Parse the result
  const content = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;

  return {
    tool: 'webreader',
    url,
    title: content.title || 'Untitled',
    content: content.content || content.text || '',
    links: content.links || [],
    summary: content.summary || '',
  };
}

/**
 * GitHub/Zread - Search GitHub repositories
 * Usage: !github <owner/repo> <query>
 */
export async function githubSearch(repo, query) {
  logger.info({ repo, query }, 'Z.AI GitHub Search (Zread)');

  const result = await mcpRequest(MCP_ENDPOINTS.zread, 'search_doc', {
    repo,
    query,
  });

  // Parse the result
  const searchResults = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;

  return {
    tool: 'github',
    repo,
    query,
    results: searchResults.results || [],
    count: searchResults.results?.length || 0,
  };
}

/**
 * Get GitHub repository structure
 * Usage: !github <owner/repo>
 */
export async function githubRepoStructure(repo) {
  logger.info({ repo }, 'Z.AI GitHub Repo Structure');

  const result = await mcpRequest(MCP_ENDPOINTS.zread, 'get_repo_structure', {
    repo,
  });

  const structure = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;

  return {
    tool: 'github',
    repo,
    structure: structure.tree || structure.files || [],
  };
}

/**
 * Read file from GitHub repository
 * Usage: !githubfile <owner/repo> <file-path>
 */
export async function githubReadFile(repo, filePath) {
  logger.info({ repo, filePath }, 'Z.AI GitHub Read File');

  const result = await mcpRequest(MCP_ENDPOINTS.zread, 'read_file', {
    repo,
    path: filePath,
  });

  const content = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;

  return {
    tool: 'github',
    repo,
    file: filePath,
    content: content.content || content,
  };
}

/**
 * Process Vision request (image analysis)
 * This requires handling image upload first
 */
export async function visionAnalyze(imagePath, analysisType = 'general') {
  logger.info({ imagePath, analysisType }, 'Z.AI Vision Analysis');

  // For vision, we use the local MCP server
  // This is a placeholder - actual implementation depends on how images are handled
  // The Vision MCP is installed locally via @z_ai/mcp-server

  return {
    tool: 'vision',
    status: 'not_implemented',
    message:
      'Vision analysis requires local MCP server setup. Use !read to analyze screenshots from URLs.',
  };
}

/**
 * Execute Z.AI action based on trigger
 */
export async function executeZAIAction(action, params) {
  switch (action) {
    case 'websearch':
      return webSearch(params.query);

    case 'read':
    case 'readurl':
      return webRead(params.url);

    case 'github':
      if (params.file) {
        return githubReadFile(params.repo, params.file);
      }
      if (params.structure) {
        return githubRepoStructure(params.repo);
      }
      return githubSearch(params.repo, params.query);

    case 'vision':
      return visionAnalyze(params.image, params.type);

    default:
      throw new Error(`Unknown Z.AI action: ${action}`);
  }
}

/**
 * Get available Z.AI MCP tools (for help/discovery)
 */
export function getAvailableTools() {
  return [
    {
      id: 'websearch',
      trigger: '!websearch',
      label: 'Web Search',
      description: 'Search the web for information',
      usage: '!websearch <query>',
      example: '!websearch latest AI developments 2026',
    },
    {
      id: 'readurl',
      trigger: '!read',
      label: 'Web Reader',
      description: 'Fetch and parse any webpage',
      usage: '!read <url>',
      example: '!read https://docs.z.ai',
    },
    {
      id: 'github',
      trigger: '!github',
      label: 'GitHub Search',
      description: 'Search GitHub repositories and docs',
      usage: '!github <owner/repo> <query>',
      example: '!github facebook/react hooks',
    },
    {
      id: 'githubfile',
      trigger: '!githubfile',
      label: 'GitHub File',
      description: 'Read file from GitHub repository',
      usage: '!githubfile <owner/repo> <path>',
      example: '!githubfile facebook/react README.md',
    },
    {
      id: 'githubtree',
      trigger: '!githubtree',
      label: 'GitHub Tree',
      description: 'Get repository structure',
      usage: '!githubtree <owner/repo>',
      example: '!githubtree facebook/react',
    },
  ];
}

/**
 * Check if Z.AI MCP is configured
 */
export function isMCPConfigured() {
  return !!ZAI_API_KEY;
}
