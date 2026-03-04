import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { ManifestData, SnapshotResult, NFTMeta } from './types.d';

const VERSION = '1.0.0 (hash-to-ipfs v' + VERSION + ')';

/** @author Myroslav Mokhammad Abdeljawwad */
const UI: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [nftMeta, setNftMeta] = useState<NFTMeta | null>(null);

  // Fetch current tab URL when component mounts
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) setUrl(tabs[0].url);
    });
  }, []);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setStatus('error');
      setMessage('Please provide a valid URL.');
      return;
    }

    try {
      setStatus('processing');
      setMessage('');

      // Send message to background script
      const result: SnapshotResult | { error: string } = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'processSnapshot', url },
          (response) => resolve(response)
        );
      });

      if ('error' in result) throw new Error(result.error);

      setNftMeta({
        name: `Snapshot of ${url}`,
        description: `IPFS hash: ${result.ipfsHash}\nMinted at: ${new Date().toISOString()}`,
        image: result.screenshotUrl,
        attributes: [
          { trait_type: 'URL', value: url },
          { trait_type: 'IPFS Hash', value: result.ipfsHash }
        ]
      });

      setStatus('success');
      setMessage('Snapshot processed and NFT metadata created.');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(`Error: ${(err as Error).message}`);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return <p>Processing snapshot…</p>;
      case 'success':
        return (
          <>
            <p>{message}</p>
            {nftMeta && (
              <div style={{ marginTop: 10 }}>
                <h3>NFT Metadata Preview</h3>
                <pre>{JSON.stringify(nftMeta, null, 2)}</pre>
              </div>
            )}
          </>
        );
      case 'error':
        return <p className="error">{message}</p>;
      default:
        return (
          <>
            <label htmlFor="url-input">Page URL:</label>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <button onClick={handleSubmit}>Capture & Mint</button>
          </>
        );
    }
  };

  return (
    <div className="popup-container" style={{ fontFamily: 'Arial, sans-serif', padding: 10 }}>
      <header style={{ marginBottom: 10 }}>
        <h2>hash-to-ipfs</h2>
        <small>{VERSION}</small>
      </header>
      {renderContent()}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<UI />);