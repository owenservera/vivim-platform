/**
 * VIVIM SDK - Identity Tools
 * 
 * MCP tools for identity management
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * Get identity info tool
 */
export const identityInfoTool: MCPToolDefinition = {
  name: 'identity_info',
  description: 'Get current identity information including DID and public key',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Identity info handler
 */
export const identityInfoHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  const identity = sdk.getIdentity();
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        did: identity?.did || null,
        publicKey: identity?.publicKey || null,
        keyType: identity?.keyType || null,
        displayName: identity?.displayName || null,
        createdAt: identity?.createdAt || null,
      }),
    }],
  };
};

/**
 * Create identity tool
 */
export const identityCreateTool: MCPToolDefinition = {
  name: 'identity_create',
  description: 'Create a new VIVIM identity',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Display name for the identity',
      },
      seed: {
        type: 'string',
        description: 'Optional seed for key derivation (hex or base64)',
      },
      keyType: {
        type: 'string',
        description: 'Key type (Ed25519, X25519)',
        default: 'Ed25519',
      },
    },
    required: [],
  },
};

/**
 * Identity create handler
 */
export const identityCreateHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const identity = await sdk.createIdentity({
      displayName: params.name as string | undefined,
      seed: typeof params.seed === 'string' ? Uint8Array.from(atob(params.seed), c => c.charCodeAt(0)) : undefined,
      keyType: (params.keyType as 'Ed25519' | 'secp256k1' | undefined) || 'Ed25519',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          did: identity.did,
          publicKey: identity.publicKey,
          keyType: identity.keyType,
          displayName: identity.displayName,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    };
  }
};

/**
 * Sign data tool
 */
export const signDataTool: MCPToolDefinition = {
  name: 'sign_data',
  description: 'Sign data with the current identity',
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'Data to sign (will be parsed as JSON if valid)',
      },
    },
    required: ['data'],
  },
};

/**
 * Sign data handler
 */
export const signDataHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  const identity = sdk.getIdentity();
  if (!identity) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'No identity available' }),
      }],
      isError: true,
    };
  }

  try {
    // Try to parse as JSON, otherwise use as string
    let data: unknown;
    const dataStr = params.data as string;
    try {
      data = JSON.parse(dataStr);
    } catch {
      data = dataStr;
    }

    const signature = await sdk.sign(data);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          signature,
          did: identity.did,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    };
  }
};

/**
 * Verify signature tool
 */
export const verifySignatureTool: MCPToolDefinition = {
  name: 'verify_signature',
  description: 'Verify a signature',
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'Original data that was signed',
      },
      signature: {
        type: 'string',
        description: 'Signature to verify',
      },
      publicKeyOrDid: {
        type: 'string',
        description: 'Public key or DID of the signer',
      },
    },
    required: ['data', 'signature', 'publicKeyOrDid'],
  },
};

/**
 * Verify signature handler
 */
export const verifySignatureHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    // Try to parse as JSON, otherwise use as string
    let data: unknown;
    const dataStr = params.data as string;
    try {
      data = JSON.parse(dataStr);
    } catch {
      data = dataStr;
    }

    const isValid = await sdk.verify(
      data,
      params.signature as string,
      params.publicKeyOrDid as string
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: isValid,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    };
  }
};

// ============================================
// WALLET TOOLS
// ============================================

/**
 * Get wallet info tool
*/
export const walletInfoTool: MCPToolDefinition = {
  name: 'wallet_info',
  description: 'Get current smart wallet information including address and type',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Wallet info handler
*/
export const walletInfoHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const wallet = sdk.wallet.getSmartWallet();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          hasWallet: !!wallet,
          address: wallet?.address || null,
          accountType: wallet?.accountType || null,
          isDeployed: wallet?.isDeployed || false,
          chainId: wallet?.chainId || null,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    };
  }
};

/**
 * Create wallet tool
*/
export const walletCreateTool: MCPToolDefinition = {
  name: 'wallet_create',
  description: 'Create a new ERC-4337 smart wallet',
  inputSchema: {
    type: 'object',
    properties: {
      accountType: {
        type: 'string',
        description: 'Smart account type (simple, safe, kernel, light, biconomy)',
        default: 'simple',
      },
      sponsorGas: {
        type: 'boolean',
        description: 'Enable gas sponsorship',
        default: true,
      },
    },
    required: [],
  },
};

/**
 * Wallet create handler
*/
export const walletCreateHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const identity = sdk.getIdentity();
    if (!identity) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'No identity available' }),
        }],
        isError: true,
      };
    }

    const wallet = await sdk.wallet.createWallet({
      owners: [identity.publicKey],
      accountType: (params.accountType as any) || 'simple',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          address: wallet.address,
          accountType: wallet.accountType,
          isDeployed: wallet.isDeployed,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    };
  }
};

/**
 * Execute transaction tool
*/
export const walletExecuteTool: MCPToolDefinition = {
  name: 'wallet_execute',
  description: 'Execute a transaction through the smart wallet',
  inputSchema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Target contract address',
      },
      value: {
        type: 'string',
        description: 'Value to send in wei',
        default: '0',
      },
      data: {
        type: 'string',
        description: 'Calldata (hex encoded)',
        default: '0x',
      },
    },
    required: ['to'],
  },
};

/**
 * Wallet execute handler
*/
export const walletExecuteHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const wallet = sdk.wallet.getSmartWallet();
    if (!wallet) {
      return {
        content: [{
        type: 'text',
        text: JSON.stringify({ error: 'No wallet initialized' }),
        }],
        isError: true,
      };
    }

    const to = params.to as string;
    const value = BigInt((params.value as string) || '0');
    const data = (params.data as string) || '0x';

    const txHash = await sdk.wallet.execute([{ to, value, data }]);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          transactionHash: txHash,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      }],
      isError: true,
    };
  }
};

/**
 * Register all identity tools
 */
export function registerIdentityTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(identityInfoTool, identityInfoHandler);
  registry.register(identityCreateTool, identityCreateHandler);
  registry.register(signDataTool, signDataHandler);
registry.register(verifySignatureTool, verifySignatureHandler);
  // Wallet tools
  registry.register(walletInfoTool, walletInfoHandler);
  registry.register(walletCreateTool, walletCreateHandler);
  registry.register(walletExecuteTool, walletExecuteHandler);
}
