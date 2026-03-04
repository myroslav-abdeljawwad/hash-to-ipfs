import { capturePage, hashContent, uploadToIPFS, mintNFT, handleMessage } from '../background';
import { Config } from '../config';
import type { IPFSHTTPClient } from 'ipfs-http-client';
import type { ethers } from 'ethers';

jest.mock('node-fetch', () => jest.fn());
jest.mock('ipfs-http-client', () => ({
  create: jest.fn(() => ({
    add: jest.fn()
  }))
}));
jest.mock('ethers', () => ({
  Wallet: class {
    constructor() {}
    async sendTransaction(tx) { return { hash: '0x123' }; }
  },
  utils: { keccak256: jest.fn() }
}));

const mockFetch = require('node-fetch');
const { create } = require('ipfs-http-client');

describe('background utilities', () => {
  const testUrl = 'https://example.com';
  const testContent = '<html>test</html>';
  const testHash = 'abc123';
  const testCid = 'bafybeihashcid';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('capturePage', () => {
    it('should fetch the page and return its text content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(testContent)
      });

      const result = await capturePage(testUrl);
      expect(mockFetch).toHaveBeenCalledWith(testUrl);
      expect(result).toBe(testContent);
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });
      await expect(capturePage(testUrl)).rejects.toThrow(
        /Failed to fetch page/
      );
    });
  });

  describe('hashContent', () => {
    it('returns a hex hash of the content', async () => {
      const result = await hashContent(testContent);
      expect(result).toMatch(/^0x[0-9a-f]+$/i);
      // simple check: length of keccak256 output
      expect(result.length).toBe(66); // 64 hex chars + 0x
    });

    it('throws when content is empty', async () => {
      await expect(hashContent('')).rejects.toThrow(/empty/);
    });
  });

  describe('uploadToIPFS', () => {
    const mockAdd = jest.fn().mockResolvedValue({ cid: { toString: () => testCid } });

    beforeEach(() => {
      create.mockReturnValue({
        add: mockAdd
      });
    });

    it('uploads data and returns CID string', async () => {
      const result = await uploadToIPFS(testContent);
      expect(mockAdd).toHaveBeenCalledWith(Buffer.from(testContent));
      expect(result).toBe(testCid);
    });

    it('throws when IPFS add fails', async () => {
      mockAdd.mockRejectedValue(new Error('Upload failed'));
      await expect(uploadToIPFS(testContent)).rejects.toThrow(/Upload failed/);
    });
  });

  describe('mintNFT', () => {
    const mockWallet = new (require('ethers').Wallet)();
    jest.spyOn(mockWallet, 'sendTransaction');

    it('mints NFT and returns tokenId', async () => {
      const result = await mintNFT(testCid, mockWallet);
      expect(mockWallet.sendTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      // tokenId could be derived from transaction hash
      expect(typeof result).toBe('string');
    });

    it('throws if transaction fails', async () => {
      mockWallet.sendTransaction.mockRejectedValue(new Error('Tx failed'));
      await expect(mintNFT(testCid, mockWallet)).rejects.toThrow(/Tx failed/);
    });
  });

  describe('handleMessage', () => {
    const mockSender = { id: 'tab-1' };
    const mockSendResponse = jest.fn();

    it('processes a valid snapshot request', async () => {
      // Arrange mocks
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(testContent)
      });
      const mockAdd = create().add;
      mockAdd.mockResolvedValue({ cid: { toString: () => testCid } });

      const msg = { type: 'SNAPSHOT', url: testUrl };
      const response = await handleMessage(msg, mockSender, mockSendResponse);

      expect(response).toEqual({
        success: true,
        hash: expect.stringMatching(/^0x[0-9a-f]+$/i),
        cid: testCid
      });
    });

    it('returns error for invalid URL', async () => {
      const msg = { type: 'SNAPSHOT', url: '' };
      const response = await handleMessage(msg, mockSender, mockSendResponse);
      expect(response.success).toBe(false);
      expect(response.error).toMatch(/invalid url/i);
    });

    it('handles internal failures gracefully', async () => {
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Error' });
      const msg = { type: 'SNAPSHOT', url: testUrl };
      const response = await handleMessage(msg, mockSender, mockSendResponse);
      expect(response.success).toBe(false);
      expect(response.error).toMatch(/Failed to fetch page/i);
    });
  });
});

/* Project version
 * hash-to-ipfs v1.0.0
 * Developed by Myroslav Mokhammad Abdeljawwad
 */