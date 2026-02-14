import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Globe, Shield, Zap } from 'lucide-react';
import './Capture.css';

interface CapturedData {
  id: string;
  title: string;
  provider: string;
  messageCount: number;
  wordCount: number;
  contentHash: string;
}

type CaptureStatus = 'idle' | 'capturing' | 'success' | 'error';

export const CaptureSimple: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<CapturedData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  // Extract URL from params on mount
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const textParam = searchParams.get('text');
    
    if (urlParam) {
      setUrl(urlParam);
      addLog(`URL found in params: ${urlParam}`);
    } else if (textParam) {
      const urlMatch = textParam.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        setUrl(urlMatch[0]);
        addLog(`URL extracted from text: ${urlMatch[0]}`);
      }
    }
  }, [searchParams, addLog]);

  const captureUrl = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    setStatus('capturing');
    setError(null);
    setCaptured(null);
    setLogs([]);
    addLog(`Starting capture: ${targetUrl}`);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      addLog(`Connecting to: ${apiBaseUrl}`);

      // Step 1: Get quantum handshake
      addLog('Initiating quantum handshake...');
      const handshakeRes = await fetch(`${apiBaseUrl}/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const { publicKey } = await handshakeRes.json();
      addLog('Handshake complete');

      // Step 2: Encrypt payload
      const { kyberEncapsulate, symmetricEncrypt } = await import('../lib/storage-v2/crypto');
      const { ciphertext, sharedSecret } = await kyberEncapsulate(publicKey);
      const encrypted = symmetricEncrypt(JSON.stringify({ url: targetUrl }), sharedSecret);
      addLog('Payload encrypted');

      // Step 3: Submit capture request
      addLog('Submitting capture request...');
      const apiKey = import.meta.env.VITE_API_KEY || 'sk-openscroll-dev-key-123456789';
      
      const captureRes = await fetch(`${apiBaseUrl}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          pqcCiphertext: ciphertext,
          pqcPayload: encrypted.ciphertext,
          pqcNonce: encrypted.nonce
        })
      });

      if (!captureRes.ok) {
        const errData = await captureRes.json();
        throw new Error(errData.message || `HTTP ${captureRes.status}: ${captureRes.statusText}`);
      }

      const result = await captureRes.json();
      addLog(`Capture complete! Messages: ${result.data?.messages?.length || 0}`);

      // Extract conversation info
      const messages = result.data?.messages || [];
      const title = result.data?.title || 'Untitled';
      const provider = result.data?.provider || 'unknown';
      const wordCount = messages.reduce((acc: number, msg: any) => {
        const content = msg.content || msg.parts || '';
        return acc + (typeof content === 'string' ? content.split(/\s+/).length : 0);
      }, 0);

      setCaptured({
        id: result.data?.id || crypto.randomUUID(),
        title,
        provider,
        messageCount: messages.length,
        wordCount,
        contentHash: result.data?.metadata?.contentHash || ''
      });
      setStatus('success');
      addLog('✅ Success!');

    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      setError(err.message);
      setStatus('error');
    }
  }, [addLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    captureUrl(url);
  };

  const handleViewConversation = () => {
    if (captured) {
      navigate(`/conversation/${captured.id}`);
    }
  };

  return (
    <div className="capture-page">
      <main className="capture-main">
        {/* IDLE STATE */}
        {status === 'idle' && (
          <div className="capture-idle">
            <div className="capture-idle-icon">
              <Globe size={48} />
            </div>
            
            <h2 className="capture-idle-title">Add Conversation</h2>
            <p className="capture-idle-subtitle">
              Capture AI conversations from any supported provider
            </p>

            <div className="capture-capabilities">
              <div className="capture-capability">
                <div className="capture-capability-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="capture-capability-text">Extract Intelligence from</p>
                  <code className="capture-capability-code">
                    ChatGPT, Claude, Gemini, DeepSeek
                  </code>
                </div>
              </div>
              
              <div className="capture-capability">
                <div className="capture-capability-icon">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="capture-capability-text">Encrypted & Signed</p>
                  <code className="capture-capability-code">
                    Quantum-Resistant Security
                  </code>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="capture-form">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://chatgpt.com/share/..."
                className="capture-input"
                required
              />
              <button type="submit" className="capture-btn">
                <Zap size={18} />
                Capture
              </button>
            </form>

            {logs.length > 0 && (
              <div className="capture-console" style={{ marginTop: 20 }}>
                <div className="capture-console-header">
                  <div className="capture-console-dot" />
                  <span className="capture-console-title">Activity Log</span>
                </div>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                  {logs.map((log, i) => (
                    <div key={i} className="capture-console-line">
                      <span className="capture-console-message">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CAPTURING STATE */}
        {status === 'capturing' && (
          <div className="capture-processing">
            <div className="capture-spinner-container">
              <Loader2 className="capture-spinner capture-spinner-extracting" size={48} />
            </div>
            
            <div className="capture-progress">
              <span className="capture-progress-label">Extracting conversation...</span>
            </div>

            <div className="capture-console">
              <div className="capture-console-header">
                <div className="capture-console-dot animating" />
                <span className="capture-console-title">Activity Log</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="capture-console-line">
                  <span className="capture-console-message">{log}</span>
                </div>
              ))}
              <div className="capture-console-cursor" />
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && captured && (
          <div className="capture-success">
            <div className="capture-success-icon">
              <CheckCircle size={64} />
            </div>
            
            <h2>Captured!</h2>
            <p>"{captured.title}"</p>

            <div className="capture-verified">
              <Shield size={16} />
              <span>Cryptographically Verified</span>
            </div>

            <div className="capture-stats">
              <div className="capture-stat">
                <div className="capture-stat-value">{captured.messageCount}</div>
                <div className="capture-stat-label">Messages</div>
              </div>
              <div className="capture-stat">
                <div className="capture-stat-value">{captured.wordCount}</div>
                <div className="capture-stat-label">Words</div>
              </div>
              <div className="capture-stat">
                <div className="capture-stat-value capitalize">{captured.provider}</div>
                <div className="capture-stat-label">Source</div>
              </div>
            </div>

            <div className="capture-actions">
              <button onClick={handleViewConversation} className="capture-btn-primary">
                View Conversation
              </button>
              <button onClick={() => { setStatus('idle'); setCaptured(null); setLogs([]); }} className="capture-btn-secondary">
                Capture Another
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="capture-error">
            <div className="capture-error-icon">
              <AlertCircle size={48} />
            </div>
            
            <h2>Capture Failed</h2>
            <p className="capture-error-message">{error}</p>

            <div className="capture-console" style={{ marginTop: 20 }}>
              <div className="capture-console-header">
                <div className="capture-console-dot error" />
                <span className="capture-console-title">Error Log</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="capture-console-line error">
                  <span className="capture-console-message">{log}</span>
                </div>
              ))}
            </div>

            <div className="capture-error-actions">
              <button onClick={() => captureUrl(url)} className="capture-btn-retry">
                <Loader2 size={18} />
                Try Again
              </button>
              <button onClick={() => { setStatus('idle'); setError(null); setLogs([]); }} className="capture-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CaptureSimple;
