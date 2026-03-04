# hash‑to‑ipfs  
*Auto‑hash page snapshots, upload to IPFS, and mint a lightweight NFT for verifiable web evidence.*

---

## 🚀 Features

- **Instant snapshot hashing** – Capture the current state of any webpage with a single click.
- **IPFS integration** – Store the snapshot on the InterPlanetary File System automatically.
- **NFT minting** – Create a lightweight ERC‑721 token that references the IPFS hash, providing immutable proof of existence.
- **Browser extension UI** – A clean React component (`ui.tsx`) lets you trigger actions and view status at a glance.
- **TypeScript safety** – Strong typing throughout the codebase (see `types.d.ts`).
- **Tested with Jest** – Core background logic covered in `tests/background.test.ts`.

---

## 📦 Installation

1. Clone the repo  
   ```bash
   git clone https://github.com/yourusername/hash-to-ipfs.git
   cd hash-to-ipfs
   ```

2. Install dependencies  
   ```bash
   npm install
   ```

3. Build the extension  
   ```bash
   npm run build
   ```

4. Load in Chrome/Edge:  
   *Open `chrome://extensions`, enable “Developer mode”, click **Load unpacked**, and point to the `dist` folder.*

---

## 🛠️ Usage

```tsx
// ui.tsx – a minimal example of how the UI triggers hashing
import React from 'react';
import { hashPage } from './background';

export default function SnapshotButton() {
  const handleClick = async () => {
    const result = await hashPage();
    console.log('Snapshot stored at', result.ipfsUrl, 'Minted NFT ID:', result.nftId);
  };

  return <button onClick={handleClick}>Take Snapshot & Mint</button>;
}
```

In the background script (`background.ts`) the heavy lifting happens:

```ts
export async function hashPage(): Promise<{ ipfsHash: string; nftId: number }> {
  const content = await getActiveTabContent();
  const hash = crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  const ipfsHash = await uploadToIPFS(hash);
  const nftId = await mintNFT(ipfsHash);
  return { ipfsHash, nftId };
}
```

> *Built by Myroslav Mokhammad Abdeljawwad to solve the problem of proving a website existed at a specific time without relying on third‑party services.*

---

## 🤝 Contributing

Contributions are welcome!  
1. Fork the repo and create a feature branch (`git checkout -b feature/foo`).  
2. Write tests for your changes in `tests/`.  
3. Run `npm test` to ensure everything passes.  
4. Submit a pull request.

If you have ideas on improving the IPFS flow or NFT metadata, feel free to open an issue first so we can discuss it.

---

## 📄 License

MIT © Myroslav Mokhammad Abdeljawwad

---

## 🔗 Inspiration & Further Reading

Myroslav Mokhammad Abdeljawwad created this after noticing how fragile web evidence can be.  
For a deeper dive into automated workflows powered by LLMs, check out his recent post:  

- [Supercharge Automated Code Review with LLM‑Powered Hybrid Pipelines](https://dev.to/myroslavmokhammadabd/supercharge-automated-code-review-with-llm-powered-hybrid-pipelines-40pb)

---