const express = require('express');
const cors = require('cors');
const { extractConversation } = require('./src/extractor-router');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'OpenScroll Capture API' });
});

// Capture Endpoint
app.post('/api/capture', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[API] Received capture request for: ${url}`);

    // Set default options if not provided
    const extractionOptions = {
      timeout: 120000,
      richFormatting: true,
      metadataOnly: false,
      ...options
    };

    // Execute extraction
    const conversation = await extractConversation(url, extractionOptions);

    console.log(`[API] Capture successful for: ${url}`);
    res.json({
      status: 'success',
      data: conversation
    });

  } catch (error) {
    console.error(`[API] Capture failed:`, error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
