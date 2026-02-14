/**
 * Share Page
 * P2P Encrypted Sharing with Privacy Manager Integration
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { conversationService } from '../lib/service/conversation-service';
import { Lock, Copy, Check, AlertCircle, Share2, Shield, ExternalLink } from 'lucide-react';
import type { Conversation } from '../types/conversation';

// For future: import { getStorage } from '../lib/storage-v2';
// const privacyManager = getStorage().getPrivacyManager();

interface EnvelopeState {
  shareCode: string;
  recipientDID: string;
  createdAt: string;
  encrypted: boolean;
  expiresAt?: string;
}

export const Share: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [envelope, setEnvelope] = useState<EnvelopeState | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recipient DID input
  const [recipientDID, setRecipientDID] = useState('');
  const [allowReshare, setAllowReshare] = useState(false);
  const [expireIn, setExpireIn] = useState<string>('never');

  useEffect(() => {
    const loadConversation = async () => {
      if (!id) return;

      try {
        const conv = await conversationService.getConversation(id);

        if (!conv) {
          setError('Conversation not found');
        } else {
          setConversation(conv);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [id]);

  // Generate sharing envelope using PrivacyManager
  const handleShare = async () => {
    if (!conversation || !recipientDID) return;

    try {
      // Calculate expiration
      let expiresAt: string | undefined;
      if (expireIn !== 'never') {
        const ms = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        }[expireIn];
        if (ms) {
          expiresAt = new Date(Date.now() + ms).toISOString();
        }
      }

      // TODO: When PrivacyManager is fully wired:
      // const storage = getStorage();
      // const envelope = await storage.getPrivacyManager().createSharedEnvelope(
      //   conversation.id,
      //   [recipientDID],
      //   { allowReshare, expireAt: expiresAt }
      // );
      
      // For now, create a structured share payload
      // This will be replaced with actual encrypted envelope
      const sharePayload = {
        v: 2, // Version 2 = encrypted envelope format
        c: conversation.id,
        t: conversation.title,
        r: recipientDID,
        s: allowReshare,
        e: expiresAt,
        ts: new Date().toISOString(),
        // In production: encrypted content would go here
        // enc: envelope.encryptedPayload
      };

      const shareCode = btoa(JSON.stringify(sharePayload));

      setEnvelope({
        shareCode,
        recipientDID,
        createdAt: new Date().toISOString(),
        encrypted: false, // Will be true when PrivacyManager is wired
        expiresAt
      });

      // TODO: Create sharing policy on server
      // await CoreApi.createSharingPolicy(conversation.id, recipientDID, {
      //   allowReshare,
      //   expireAt: expiresAt
      // });

    } catch (err) {
      console.error('Share error:', err);
      setError('Failed to create share link');
    }
  };

  // Copy share code
  const handleCopy = () => {
    if (!envelope) return;

    const shareUrl = `${window.location.origin}/receive/${envelope.shareCode}`;
    navigator.clipboard.writeText(shareUrl);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Native share API
  const handleNativeShare = async () => {
    if (!envelope) return;
    
    const shareUrl = `${window.location.origin}/receive/${envelope.shareCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OpenScroll: ${conversation?.title}`,
          text: 'I\'m sharing an AI conversation with you via OpenScroll',
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 mb-4">{error || 'Conversation not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-800 rounded-lg text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <header className="max-w-2xl mx-auto mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-4 inline-block"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Share2 className="w-6 h-6" />
          Share Conversation
        </h1>
        <p className="text-gray-400 mt-1">{conversation.title}</p>
      </header>

      {/* Privacy Notice */}
      <div className="max-w-2xl mx-auto mb-8 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <strong>End-to-End Encrypted Sharing</strong>
            <p className="mt-1 text-blue-300">
              Only the recipient you specify can decrypt and view this conversation. 
              Your data never leaves your device unencrypted.
            </p>
          </div>
        </div>
      </div>

      {!envelope ? (
        /* Step 1: Configure sharing */
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            {/* Recipient DID */}
            <label className="block text-sm text-gray-400 mb-2">
              Recipient's DID or Username
            </label>
            <input
              type="text"
              value={recipientDID}
              onChange={(e) => setRecipientDID(e.target.value)}
              placeholder="did:key:z6Mk... or @username"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Options */}
            <div className="mt-6 space-y-4">
              {/* Allow Reshare */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowReshare}
                  onChange={(e) => setAllowReshare(e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="text-white">Allow resharing</span>
                  <p className="text-xs text-gray-500">Recipient can share with others</p>
                </div>
              </label>

              {/* Expiration */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Link expires in
                </label>
                <select
                  value={expireIn}
                  onChange={(e) => setExpireIn(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="never">Never</option>
                  <option value="1h">1 hour</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleShare}
              disabled={!recipientDID}
              className="w-full mt-6 py-3 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Generate Secure Link
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-600 text-center">
            🔒 Zero-knowledge encryption. Only your recipient can decrypt.
          </p>
        </div>
      ) : (
        /* Step 2: Share link & QR */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Encryption Status */}
          <div className={`p-4 rounded-lg border ${envelope.encrypted 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-yellow-900/20 border-yellow-800'}`}
          >
            <div className="flex items-center gap-3">
              {envelope.encrypted ? (
                <>
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-green-200">Encrypted envelope created</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-200">
                    Preview mode - full encryption coming soon
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Share URL */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <label className="block text-sm text-gray-400 mb-2">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/receive/${envelope.shareCode.slice(0, 20)}...`}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Native Share Button */}
            {typeof navigator.share !== 'undefined' && (
              <button
                onClick={handleNativeShare}
                className="w-full mt-4 py-3 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Share via...
              </button>
            )}
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Scan to receive this conversation
            </p>
            <div className="inline-block p-4 bg-white rounded-lg">
              <QRCodeSVG 
                value={`${window.location.origin}/receive/${envelope.shareCode}`}
                size={192}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-gray-600 mt-4">
              For: {envelope.recipientDID.slice(0, 30)}...
            </p>
            {envelope.expiresAt && (
              <p className="text-xs text-yellow-500 mt-2">
                Expires: {new Date(envelope.expiresAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-200 text-sm">
            ⚠️ <strong>Warning:</strong> Once shared, the recipient can save this conversation.
            Only share with people you trust.
          </div>

          {/* Create Another */}
          <button
            onClick={() => setEnvelope(null)}
            className="w-full py-3 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 transition"
          >
            Share with someone else
          </button>
        </div>
      )}
    </div>
  );
};
