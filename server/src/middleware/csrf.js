import csurf from 'csurf';

// Create the csurf middleware instance.
// We use cookie: true so it doesn't strictly depend on sessions.
export const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

export function setCsrfCookie(req, res, next) {
  // csurf attaches req.csrfToken()
  if (req.csrfToken) {
    const token = req.csrfToken();
    res.cookie('csrf_token', token, {
      httpOnly: false, // Must be readable by frontend JS to set in header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }
  next();
}
