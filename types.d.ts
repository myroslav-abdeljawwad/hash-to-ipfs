declare module 'hash-to-ipfs' {
  /**
   * Represents the result of hashing a page snapshot.
   */
  export interface HashResult {
    /** The SHA-256 hash as a hex string */
    sha256: string;
    /** Timestamp when the hash was generated (ISO 8601) */
    timestamp: string;
    /** Optional metadata about the page */
    metadata?: PageMetadata;
  }

  /**
   * Basic information about a web page snapshot.
   */
  export interface PageMetadata {
    url: string;
    title?: string;
    faviconUrl?: string;
    viewportWidth: number;
    viewportHeight: number;
  }

  /**
   * Options for configuring the IPFS upload process.
   */
  export interface IpfsUploadOptions {
    /** The CID version to use (1 or 0). Defaults to 1. */
    cidVersion?: 0 | 1;
    /** Pinning service API key if required. */
    pinningApiKey?: string;
    /** Timeout in milliseconds for the IPFS request. */
    timeoutMs?: number;
  }

  /**
   * Result of uploading content to IPFS.
   */
  export interface IpfsUploadResult {
    /** The CID returned by IPFS */
    cid: string;
    /** URL pointing to the resource via a public gateway */
    gatewayUrl: string;
    /** Size in bytes of the uploaded payload */
    sizeBytes: number;
  }

  /**
   * Configuration for NFT minting.
   */
  export interface NftMintOptions {
    /** Ethereum network to use (e.g., mainnet, ropsten) */
    network: string;
    /** Private key or wallet address for signing transactions */
    privateKey: string;
    /** Smart contract address of the NFT collection */
    contractAddress: string;
    /** Optional metadata URI to associate with the token */
    metadataUri?: string;
  }

  /**
   * Result of minting an NFT.
   */
  export interface NftMintResult {
    /** Transaction hash of the mint operation */
    txHash: string;
    /** Token ID assigned by the contract */
    tokenId: string;
    /** URL to view the transaction on a block explorer */
    explorerUrl: string;
  }

  /**
   * Utility functions for hashing and uploading.
   */
  export namespace Utils {
    /**
     * Compute SHA-256 hash of a Uint8Array.
     * @param data - Binary data to hash
     * @returns Promise resolving to hex string
     */
    function sha256(data: Uint8Array): Promise<string>;

    /**
     * Uploads binary data to IPFS using the provided options.
     * @param data - Binary payload
     * @param options - Configuration for upload
     * @returns Promise resolving to IpfsUploadResult
     */
    function uploadToIpfs(
      data: Uint8Array,
      options?: IpfsUploadOptions
    ): Promise<IpfsUploadResult>;
  }

  /**
   * High-level service orchestrating snapshot, hash, IPFS upload and NFT minting.
   */
  export class SnapshotService {
    constructor(options?: { pinningApiKey?: string; privateKey?: string });

    /**
     * Capture a snapshot of the current page from the browser context.
     * @returns Promise resolving to PageMetadata
     */
    capturePage(): Promise<PageMetadata>;

    /**
     * Generate hash and upload to IPFS, then mint an NFT referencing it.
     * @param metadata - Optional page metadata; if omitted, captured automatically
     * @returns Promise resolving to NftMintResult
     */
    createEvidence(metadata?: PageMetadata): Promise<NftMintResult>;
  }

  /**
   * Error types specific to this library.
   */
  export class HashError extends Error {}
  export class IpfsUploadError extends Error {}
  export class NftMintError extends Error {}

  // Export a singleton instance for convenience
  export const defaultService: SnapshotService;
}