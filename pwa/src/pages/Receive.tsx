import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Unlock, AlertCircle, CheckCircle, Shield, Clock, User } from 'lucide-react';

// Future: import { getStorage } from '../lib/storage-v2';
// const privacyManager = getStorage().getPrivacyManager();

interface SharePayload {
  v: number;           // Version
  c: string;           // Conversation ID
  t: string;           // Title
  r: string;           // Recipient DID
  s: boolean;          // Allow reshare
  e?: string;          // Expires at
  ts: string;          // Created timestamp
  enc?: string;        // Encrypted content (future)
}

interface ConversationData {
  id: string;
  title: string;
  senderDID?: string;
  allowReshare: boolean;
  expiresAt?: string;
  version: number;
}

export const Receive: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [saved, setSaved] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const receiveConversation = async () => {
      if (!code) return;

      try {
        // Decode share code
        let data: SharePayload;
        try {
          const decoded = atob(code);
          data = JSON.parse(decoded);
        } catch {
          // Try URL-safe base64
          try {
            const urlSafe = code.replace(/-/g, '+').replace(/_/g, '/');
            data = JSON.parse(atob(urlSafe));
          } catch {
            throw new Error('Invalid share code format');
          }
        }

        // Version check
        if (data.v && data.v > 2) {
          throw new Error('This share link requires a newer version of OpenScroll');
        }

        // Check expiration
        if (data.e) {
          const expiresAt = new Date(data.e);
          if (expiresAt < new Date()) {
            setExpired(true);
            setError('This share link has expired');
            setLoading(false);
            return;
          }
        }

        // TODO: When PrivacyManager is fully wired:
        // 1. Verify this share is intended for us
        // const myDID = await getStorage().getMyDID();
        // if (data.r !== myDID) {
        //   throw new Error('This share is not intended for you');
        // }
        //
        // 2. Decrypt the envelope
        // const decrypted = await privacyManager.decryptSharedEnvelope(
        //   { ...data.envelope },
        //   mySecretKey
        // );
        //
        // 3. Verify content integrity
        // const verification = await privacyManager.verifyUntrustedContent(
        //   decrypted.content,
        //   data.senderDID,
        //   decrypted.merkleRoot
        // );

        setConversation({
          id: data.c,
          title: data.t || 'Shared Conversation',
          senderDID: undefined, // Would come from envelope
          allowReshare: data.s || false,
          expiresAt: data.e,
          version: data.v || 1
        });

        setLoading(false);
      } catch (err) {
        console.error('Receive error:', err);
        setError(err instanceof Error ? err.message : 'Invalid share code');
        setLoading(false);
      }
    };

    receiveConversation();
  }, [code]);

  // Handle save to library
  const handleSave = async () => {
    if (!conversation) return;

    try {
      // TODO: Full implementation with PrivacyManager
      // 1. Decrypt envelope content
      // const content = await privacyManager.decryptSharedEnvelope(envelope, myKey);
      //
      // 2. Verify integrity
      // const valid = await privacyManager.verifyUntrustedContent(...);
      // if (!valid.canTrust) throw new Error('Content verification failed');
      //
      // 3. Import to local storage
      // const storage = getStorage();
      // await storage.importFromExtraction({
      //   id: conversation.id,
      //   title: conversation.title,
      //   messages: content.messages,
      //   metadata: {
      //     sharedFrom: conversation.senderDID,
      //     receivedAt: new Date().toISOString()
      //   }
      // });

      // For now, just show success
      setSaved(true);

      // Navigate to the conversation after a delay
      setTimeout(() => {
        navigate(`/conversation/${conversation.id}`);
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save conversation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Decrypting share link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-2xl mx-auto py-12">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Cancel
        </button>

        {expired ? (
          /* Expired state */
          <div className="text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
            <p className="text-gray-400 mb-6">
              This share link has expired and is no longer valid.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-800 rounded-lg font-medium text-white hover:bg-gray-700 transition"
            >
              Go to Library
            </button>
          </div>
        ) : error ? (
          /* Error state */
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Share Link</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <p className="text-sm text-gray-600">
              Make sure you opened the correct link from OpenScroll.
            </p>
          </div>
        ) : saved ? (
          /* Saved state */
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Saved!</h2>
            <p className="text-gray-400">Conversation added to your library.</p>
          </div>
        ) : conversation ? (
          /* Preview before save */
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
              <Unlock className="w-6 h-6 text-cyan-400" />
              Shared Conversation
            </h2>

            {/* Privacy notice */}
            <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-blue-400 font-medium">End-to-End Encrypted</span>
                  <p className="text-gray-400 mt-1">
                    This content was encrypted specifically for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Sender info */}
            {conversation.senderDID && (
              <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-400">From:</span>
                    <span className="text-white ml-2 font-mono text-xs">
                      {conversation.senderDID.slice(0, 30)}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation preview */}
            <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
              <h3 className="font-semibold mb-2 text-lg">{conversation.title}</h3>
              <p className="text-sm text-gray-400">
                This will be added to your private library.
              </p>

              {/* Metadata */}
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Format version:</span>
                  <span>v{conversation.version}</span>
                </div>
                {conversation.allowReshare && (
                  <div className="flex justify-between">
                    <span>Resharing:</span>
                    <span className="text-green-400">Allowed</span>
                  </div>
                )}
                {conversation.expiresAt && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="text-yellow-400">
                      {new Date(conversation.expiresAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning for V1 (unencrypted) */}
            {conversation.version === 1 && (
              <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-200 text-sm">
                ⚠️ <strong>Note:</strong> This is a legacy share link (v1). 
                Full encryption is available in newer versions.
              </div>
            )}

            {/* Save button */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 bg-gray-800 rounded-lg font-bold text-white hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Save to Library
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-600 text-center">
              🔒 Will be stored privately in your local library. Only you can see it.
            </p>
          </div>
        ) : (
          /* Loading state */
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading conversation...</p>
          </div>
        )}
      </div>
    </div>
  );
};
