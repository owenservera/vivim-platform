import { Router } from 'express';
import {
  webSearch,
  webRead,
  githubSearch,
  githubRepoStructure,
  githubReadFile,
  getAvailableTools,
  isMCPConfigured,
} from '../services/zai-mcp-service.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.get('/tools', (req, res) => {
  if (!isMCPConfigured()) {
    return res.json({
      success: false,
      error: 'Z.AI MCP not configured',
    });
  }

  res.json({
    success: true,
    data: getAvailableTools(),
  });
});

router.post('/websearch', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const result = await webSearch(query);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error: error.message }, 'Web search failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webread', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const result = await webRead(url);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error: error.message }, 'Web read failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/github', async (req, res) => {
  try {
    const { repo, query, file, tree } = req.body;

    if (!repo) {
      return res.status(400).json({
        success: false,
        error: 'Repository (owner/repo) is required',
      });
    }

    let result;
    if (file) {
      result = await githubReadFile(repo, file);
    } else if (tree) {
      result = await githubRepoStructure(repo);
    } else {
      result = await githubSearch(repo, query || '');
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error: error.message }, 'GitHub search failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

export const zaiMcpRouter = router;
