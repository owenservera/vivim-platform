import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('[AuthCallback] Supabase not configured, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    const handleCallback = async () => {
      try {
        const { error: sessionError } = await supabase!.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // Check if we have a session
        const { data: { session } } = await supabase!.auth.getSession();

        if (session) {
          // Successful auth, redirect to home
          console.log('[AuthCallback] Auth successful, redirecting to home');
          navigate('/', { replace: true });
        } else {
          // No session, check for error params
          const errorParam = searchParams.get('error');
          const errorDesc = searchParams.get('error_description');

          if (errorParam) {
            setError(errorDesc || `Auth error: ${errorParam}`);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
          } else {
            navigate('/login', { replace: true });
          }
        }
      } catch (err: any) {
        console.error('[AuthCallback] Error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Authentication Failed</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}

export default AuthCallback;
