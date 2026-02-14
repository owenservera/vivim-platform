/**
 * Google OAuth Authentication Routes
 */

import { Router } from 'express';
import passport from '../middleware/google-auth.js';

const router = Router();

router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/api/v1/auth/failed' }),
  (req, res) => {
    res.redirect(process.env.GOOGLE_SUCCESS_REDIRECT || 'http://localhost:5173');
  }
);

router.get('/failed', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'Google authentication failed'
  });
});

router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }
  
  res.json({
    success: true,
    user: {
      id: req.user.id,
      did: req.user.did,
      email: req.user.email,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      verificationLevel: req.user.verificationLevel
    }
  });
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
    res.json({ success: true });
  });
});

export default router;
