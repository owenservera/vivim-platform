import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContextSettingsService } from '../context/settings-service';

const router = Router();
const DEV_USER_ID = 'dev-user-001';

export function createSettingsRoutes(prisma: PrismaClient) {
  const settingsService = new ContextSettingsService({ prisma });

  router.get('/context', async (req, res) => {
    try {
      const userId = (req.query.userId as string) || DEV_USER_ID;
      const settings = await settingsService.getSettingsWithMetadata(userId);
      res.json(settings);
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  router.put('/context', async (req, res) => {
    try {
      const userId = (req.body.userId as string) || DEV_USER_ID;
      const result = await settingsService.updateSettings(userId, req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.errors,
        });
      }

      res.json({
        success: true,
        settings: result.settings,
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  router.patch('/context/*splat', async (req, res) => {
    try {
      const userId = (req.body.userId as string) || DEV_USER_ID;
      // Extract the path after /context/ from the URL
      const urlPath = req.url; // Use req.url instead of req.path to get the full path
      const pathMatch = urlPath.match(/^\/context\/(.*)$/);
      const path = pathMatch ? pathMatch[1] || '' : '';
      const { value } = req.body;

      const result = await settingsService.updateSetting(userId, path, value);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.errors,
        });
      }

      res.json({
        success: true,
        settings: result.settings,
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  router.post('/context/preset/:name', async (req, res) => {
    try {
      const userId = (req.body.userId as string) || DEV_USER_ID;
      const { name } = req.params;
      const result = await settingsService.applyPreset(userId, name as any);

      if (!result.success) {
        return res.status(400).json({
          error: 'Failed to apply preset',
          details: result.errors,
        });
      }

      res.json({
        success: true,
        preset: name,
        settings: result.settings,
      });
    } catch (error) {
      console.error('Failed to apply preset:', error);
      res.status(500).json({ error: 'Failed to apply preset' });
    }
  });

  router.post('/context/reset', async (req, res) => {
    try {
      const userId = (req.body.userId as string) || DEV_USER_ID;
      const settings = await settingsService.resetToDefaults(userId);

      res.json({
        success: true,
        settings,
      });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      res.status(500).json({ error: 'Failed to reset settings' });
    }
  });

  router.get('/context/presets', async (req, res) => {
    try {
      const presets = settingsService.getPresets();
      res.json({ presets });
    } catch (error) {
      console.error('Failed to get presets:', error);
      res.status(500).json({ error: 'Failed to get presets' });
    }
  });

  router.get('/context/schema', async (req, res) => {
    try {
      const schema = settingsService.getSettingsSchema();
      res.json({ schema });
    } catch (error) {
      console.error('Failed to get schema:', error);
      res.status(500).json({ error: 'Failed to get schema' });
    }
  });

  return router;
}
