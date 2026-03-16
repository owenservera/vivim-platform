import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Key, 
  Globe, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  Fingerprint
} from 'lucide-react';

/* Services & Utils */
import { loginWithGoogle } from '../lib/auth-api';
import { cn } from '../lib/utils';

/* Components */
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const FEATURES = [
    { icon: <Shield className="w-5 h-5 text-emerald-500" />, title: 'Self-Sovereign', desc: 'Own your conversation history with end-to-end encryption.' },
    { icon: <Globe className="w-5 h-5 text-blue-500" />, title: 'Distributed', desc: 'Sync your data across devices via P2P network.' },
    { icon: <Sparkles className="w-5 h-5 text-purple-500" />, title: 'AI-Native', desc: 'Unified memory across all major AI providers.' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left Side: Branding & Info */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto lg:mx-0 shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black text-3xl tracking-tighter">V</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter lg:text-6xl">
              Own Your <span className="text-primary">Intelligence.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
              VIVIM is the decentralized memory layer for your AI conversations. 
              Search, fork, and share your insights with complete privacy.
            </p>
          </div>

          <div className="grid gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex flex-col lg:flex-row items-center lg:items-start gap-4 p-4 rounded-2xl hover:bg-primary/5 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border/50 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="font-bold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md mx-auto">
          <Card variant="glass" padding="lg" className="border-none shadow-2xl space-y-8 py-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground font-medium">Access your sovereign AI archive</p>
            </div>

            <div className="space-y-4">
              <Button 
                variant="primary" 
                fullWidth 
                size="lg" 
                className="h-14 rounded-xl text-lg shadow-xl shadow-primary/20 bg-gradient-to-br from-primary-500 to-accent-500 border-none"
                onClick={handleGoogleLogin}
                isLoading={loading}
              >
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-black">
                  <span className="bg-card px-4 text-muted-foreground/50">Security Check</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                fullWidth 
                size="lg" 
                className="h-14 rounded-xl text-lg border-border/50 hover:bg-secondary"
                onClick={() => navigate('/identity')}
              >
                <Fingerprint className="w-5 h-5 mr-2 text-primary" />
                Use Device Key
              </Button>
            </div>

            <div className="pt-4 space-y-4">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[11px] font-medium leading-relaxed">
                  Your identity is cryptographically tied to your device. 
                  We never see your plain-text conversations.
                </p>
              </div>
              
              <p className="text-[10px] text-center text-muted-foreground/50 font-mono uppercase tracking-widest">
                VIVIM PROTOCOL v1.0.0
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
