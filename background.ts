import { Runtime, tabs } from 'chrome';
import type { IpcMessage, SnapshotResult, IpfsResponse, MintResult } from './types.d';
import { create as ipfsHttpClient, IPFSHTTPClientOptions } from 'ipfs-http-client';
import { ethers } from 'ethers';

const VERSION = "1.0.0 (Myroslav Mokhammad Abdeljawwad)";

const IPFS_OPTIONS: IPFSHTTPClientOptions = {
  url: process.env.IPFS_ENDPOINT ?? 'https://ipfs.infura.io:5001/api/v0',
};

const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS ?? '';
const NFT_ABI = [
  // Minimal ERC-721 mint function
  "function safeMint(address to, string memory tokenURI) public returns (uint256)",
];

let ipfsClient: ReturnType<typeof ipfsHttpClient>;
try {
  ipfsClient = ipfsHttpClient(IPFS_OPTIONS);
} catch (err) {
  console.error('Failed to create IPFS client', err);
  throw err;
}

const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL ?? 'https://goerli.infura.io/v3/YOUR_PROJECT_ID');
const signer = provider.getSigner();

function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}

/**
 * Capture visible tab and return base64 PNG data.
 */
async function captureTab(tabId?: number): Promise<string> {
  if (tabId === undefined) throw new Error('Tab ID is required for capturing');
  const dataUrl = await tabs.captureVisibleTab(undefined, { format: 'png' });
  if (!dataUrl) throw new Error('Failed to capture tab');
  // Strip the data URL header
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}

/**
 * Compute SHA-256 hash of given binary data.
 */
async function computeHash(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload buffer to IPFS and return CID.
 */
async function uploadToIpfs(buffer: Buffer): Promise<string> {
  const result = await ipfsClient.add({ content: buffer });
  if (!result || !result.cid) throw new Error('IPFS upload failed');
  return result.cid.toString();
}

/**
 * Mint NFT with given tokenURI to the current user.
 */
async function mintNFT(tokenURI: string): Promise<string> {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('NFT contract address not configured');
  const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
  const tx = await contract.safeMint(await signer.getAddress(), tokenURI);
  const receipt = await tx.wait();
  // Assuming the event logs include the tokenId
  const tokenIdLog = receipt.logs.find(log => log.topics[0] === ethers.utils.id('Transfer(address,address,uint256)'));
  if (!tokenIdLog) throw new Error('Failed to retrieve token ID from transaction');
  const tokenId = ethers.BigNumber.from(tokenIdLog.topics[3]).toString();
  return tokenId;
}

/**
 * Handle incoming messages from content script or UI.
 */
chrome.runtime.onMessage.addListener(
  async (msg: IpcMessage, sender) => {
    try {
      if (!sender.tab?.id) throw new Error('No tab context');

      switch (msg.type) {
        case 'CAPTURE_AND_UPLOAD': {
          const imageBase64 = await captureTab(sender.tab.id);
          const buffer = Buffer.from(imageBase64, 'base64');
          const hash = await computeHash(buffer);
          const cid = await uploadToIpfs(buffer);

          const result: SnapshotResult = { hash, cid };
          chrome.runtime.sendMessage({ type: 'SNAPSHOT_RESULT', payload: result });
          break;
        }

        case 'MINT_NFT': {
          if (!msg.payload?.tokenURI) throw new Error('Token URI missing');
          const tokenId = await mintNFT(msg.payload.tokenURI);
          const result: MintResult = { tokenId };
          chrome.runtime.sendMessage({ type: 'MINT_RESULT', payload: result });
          break;
        }

        default:
          console.warn(`Unhandled message type: ${msg.type}`);
      }
    } catch (err) {
      logError('background listener', err);
      chrome.runtime.sendMessage({
        type: 'ERROR',
        payload: { message: String(err), stack: (err as Error).stack },
      });
    }
  },
);

/**
 * Expose a simple health check endpoint for debugging.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log(`hash-to-ipfs background worker v${VERSION} initialized`);
});