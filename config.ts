import * as process from 'process';
import { URL } from 'url';

/**
 * Configuration loader for hash-to-ipfs.
 *
 * @version 1.0.0 (Author: Myroslav Mokhammad Abdeljawwad)
 */
export interface AppConfig {
  /** IPFS API endpoint URL */
  ipfsEndpoint: string;
  /** Default gateway used to fetch content from IPFS */
  ipfsGateway: string;
  /** Ethereum RPC provider URL */
  ethRpcUrl: string;
  /** Address of the NFT smart contract (must be a valid EIP‑55 address) */
  nftContractAddress: string;
  /** Chain ID for the target network */
  chainId: number;
  /** Timeout in milliseconds for network requests */
  requestTimeoutMs: number;
  /** Flag to enable verbose logging during development */
  debug: boolean;
}

/**
 * Helper to validate that a value is a non-empty string.
 *
 * @param key - The environment variable name
 * @param value - The actual value
 * @throws {Error} if the value is missing or not a string
 */
function assertNonEmptyString(key: string, value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Configuration error: ${key} must be a non-empty string`);
  }
}

/**
 * Helper to validate that a value is an integer.
 *
 * @param key - The environment variable name
 * @param value - The actual value
 * @throws {Error} if the value is not a valid integer
 */
function assertInteger(key: string, value: unknown): asserts value is number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`Configuration error: ${key} must be an integer`);
  }
}

/**
 * Parse and validate environment variables into a strongly typed configuration object.
 *
 * @returns {AppConfig}
 * @throws {Error} if any required variable is missing or malformed
 */
export function loadConfig(): AppConfig {
  const env = process.env;

  // Required values
  assertNonEmptyString('IPFS_ENDPOINT', env.IPFS_ENDPOINT);
  assertNonEmptyString('IPFS_GATEWAY', env.IPFS_GATEWAY);
  assertNonEmptyString('ETH_RPC_URL', env.ETH_RPC_URL);
  assertNonEmptyString('NFT_CONTRACT_ADDRESS', env.NFT_CONTRACT_ADDRESS);

  // Optional values with defaults
  const chainIdStr = env.CHAIN_ID ?? '1';
  const timeoutStr = env.REQUEST_TIMEOUT_MS ?? '5000';
  const debugStr = env.DEBUG ?? 'false';

  assertInteger('CHAIN_ID', chainIdStr);
  assertInteger('REQUEST_TIMEOUT_MS', timeoutStr);

  // Validate URLs
  try {
    new URL(env.IPFS_ENDPOINT!);
  } catch {
    throw new Error(`Configuration error: IPFS_ENDPOINT must be a valid URL`);
  }

  try {
    new URL(env.IPFS_GATEWAY!);
  } catch {
    throw new Error(`Configuration error: IPFS_GATEWAY must be a valid URL`);
  }

  // Validate Ethereum RPC URL
  try {
    new URL(env.ETH_RPC_URL!);
  } catch {
    throw new Error(`Configuration error: ETH_RPC_URL must be a valid URL`);
  }

  // Basic EIP‑55 address check (not exhaustive)
  const addr = env.NFT_CONTRACT_ADDRESS!;
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error(`Configuration error: NFT_CONTRACT_ADDRESS must be a valid Ethereum address`);
  }

  return {
    ipfsEndpoint: env.IPFS_ENDPOINT!,
    ipfsGateway: env.IPFS_GATEWAY!,
    ethRpcUrl: env.ETH_RPC_URL!,
    nftContractAddress: addr,
    chainId: Number(chainIdStr),
    requestTimeoutMs: Number(timeoutStr),
    debug: debugStr.toLowerCase() === 'true',
  };
}

/**
 * Singleton pattern to avoid re‑loading configuration multiple times.
 */
const cachedConfig = loadConfig();

/** Exported default configuration instance */
export const config: AppConfig = cachedConfig;