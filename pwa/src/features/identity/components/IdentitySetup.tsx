import React, { useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { getChainClient } from '../../../lib/chain-client';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../../components/ui/card';
import { Shield, Key, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IdentitySetup: React.FC = () => {
  const { identity, actions } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setLocalStep] = useState<'welcome' | 'generating' | 'success'>(identity.did ? 'success' : 'welcome');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLocalStep('generating');
    try {
      const chain = await getChainClient();
      const did = await chain.initializeIdentity();
      // AppStore is updated inside getChainClient
      setLocalStep('success');
    } catch (err) {
      console.error('Identity generation failed', err);
      setLocalStep('welcome');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (identity.did) {
      navigator.clipboard.writeText(identity.did);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Create Your Identity</CardTitle>
                <CardDescription>
                  VIVIM uses decentralized identifiers (DIDs) to give you full control over your AI memory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-sm text-yellow-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>Your keys will be stored locally on this device. We never see them, and we cannot recover them if lost.</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> No email or password required
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Ownership of all generated content
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> End-to-end encrypted storage
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGenerate} className="w-full py-6 text-lg" disabled={isGenerating}>
                  Generate Identity
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-12"
          >
            <div className="relative w-24 h-24 mx-auto">
              <Loader2 className="w-24 h-24 animate-spin text-primary-600 opacity-20" />
              <Shield className="w-12 h-12 text-primary-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Creating Cryptographic Keys</h3>
              <p className="text-muted-foreground">Deriving your unique DID from Ed25519...</p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-green-100 shadow-xl bg-gradient-to-b from-green-50/30 to-background">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Identity Ready</CardTitle>
                <CardDescription>
                  Your decentralized identity has been established on the blockchain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Public DID</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-4 bg-muted rounded-xl text-xs break-all font-mono border">
                      {identity.did}
                    </code>
                    <Button variant="outline" size="icon" className="h-auto px-3" onClick={handleCopy}>
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-primary-50 rounded-xl flex gap-4 items-start border border-primary-100">
                  <Key className="w-6 h-6 text-primary-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm text-primary-900">Keys Secured</h4>
                    <p className="text-xs text-primary-800 leading-relaxed">
                      Your identity key is now active. All future conversations and knowledge extractions will be signed by you.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => window.location.href = '/chain-chat'} className="w-full py-6 text-lg">
                  Enter VIVIM AI
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
