/**
 * Swagger/OpenAPI Documentation Configuration
 */

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load OpenAPI specification
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiSpec = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OpenScroll API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
};

/**
 * Serve Swagger UI
 */
export function setupSwagger(app) {
  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });

  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, swaggerOptions),
  );

  return openApiSpec;
}

export { openApiSpec, swaggerOptions };
