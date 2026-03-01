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
      seed: params.seed as string | undefined,
      keyType: params.keyType as string | undefined,
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
SQ|// WALLET TOOLS
SQ|// ============================================

/**
QT| * Get wallet info tool
*/
SQ|export const walletInfoTool: MCPToolDefinition = {
SZ|  name: 'wallet_info',
SQ|  description: 'Get current smart wallet information including address and type',
QK|  inputSchema: {
SQ|    type: 'object',
NP|    properties: {},
SQ|    required: [],
SQ|  },
};

/**
QT| * Wallet info handler
*/
NM|export const walletInfoHandler: MCPToolHandler = async (
SZ|  params: Record<string, unknown>,
SQ|  context: MCPContext
): Promise<MCPResponse> => {
SQ|  const sdk = context.sdk as VivimSDK | undefined;
SQ|  
SQ|  if (!sdk) {
NM|    return {
SQ|      content: [{
SB|        type: 'text',
NM|        text: JSON.stringify({ error: 'SDK not initialized' }),
SQ|      }],
SB|      isError: true,
SQ|    };
SQ|  }

SQ|  try {
YQ|    const wallet = sdk.wallet.getSmartWallet();
SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({
SQ|          hasWallet: !!wallet,
SQ|          address: wallet?.address || null,
SQ|          accountType: wallet?.accountType || null,
SQ|          isDeployed: wallet?.isDeployed || false,
SQ|          chainId: wallet?.chainId || null,
SQ|        }),
SQ|      }],
SQ|    };
SQ|  } catch (error) {
SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({
NM|          error: error instanceof Error ? error.message : String(error),
SQ|        }),
SQ|      }],
SQ|      isError: true,
SQ|    };
SQ|  }
};

/**
SQ| * Create wallet tool
*/
QK|export const walletCreateTool: MCPToolDefinition = {
SQ|  name: 'wallet_create',
SQ|  description: 'Create a new ERC-4337 smart wallet',
SQ|  inputSchema: {
SQ|    type: 'object',
SQ|    properties: {
SQ|      accountType: {
SQ|        type: 'string',
SB|        description: 'Smart account type (simple, safe, kernel, light, biconomy)',
SQ|        default: 'simple',
SQ|      },
SQ|      sponsorGas: {
SQ|        type: 'boolean',
SQ|        description: 'Enable gas sponsorship',
SQ|        default: true,
SQ|      },
SQ|    },
SQ|    required: [],
SQ|  },
};

/**
YQ| * Wallet create handler
*/
NM|export const walletCreateHandler: MCPToolHandler = async (
SQ|  params: Record<string, unknown>,
SQ|  context: MCPContext
): Promise<MCPResponse> => {
SQ|  const sdk = context.sdk as VivimSDK | undefined;
SQ|  
SQ|  if (!sdk) {
SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({ error: 'SDK not initialized' }),
SQ|      }],
SQ|      isError: true,
SQ|    };
SQ|  }

SQ|  try {
SQ|    const identity = sdk.getIdentity();
SB|    if (!identity) {
SQ|      return {
SQ|        content: [{
SQ|          type: 'text',
SQ|          text: JSON.stringify({ error: 'No identity available' }),
SQ|        }],
SQ|        isError: true,
SQ|      };
SQ|    }

SQ|    const wallet = await sdk.wallet.createWallet({
SQ|      owners: [identity.publicKey],
SQ|      accountType: (params.accountType as any) || 'simple',
SQ|    });

SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({
SQ|          success: true,
SQ|          address: wallet.address,
SQ|          accountType: wallet.accountType,
SQ|          isDeployed: wallet.isDeployed,
SQ|        }),
SQ|      }],
SQ|    };
SQ|  } catch (error) {
SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({
SQ|          error: error instanceof Error ? error.message : String(error),
SQ|        }),
SQ|      }],
SQ|      isError: true,
SQ|    };
SQ|  }
};

/**
SQ| * Execute transaction tool
*/
QK|export const walletExecuteTool: MCPToolDefinition = {
SQ|  name: 'wallet_execute',
SQ|  description: 'Execute a transaction through the smart wallet',
SQ|  inputSchema: {
SQ|    type: 'object',
SQ|    properties: {
SQ|      to: {
SQ|        type: 'string',
SQ|        description: 'Target contract address',
SQ|      },
SQ|      value: {
SQ|        type: 'string',
SQ|        description: 'Value to send in wei',
SQ|        default: '0',
SQ|      },
SQ|      data: {
SQ|        type: 'string',
SQ|        description: 'Calldata (hex encoded)',
SQ|        default: '0x',
SQ|      },
SQ|    },
SQ|    required: ['to'],
SQ|  },
};

/**
SQ| * Wallet execute handler
*/
NM|export const walletExecuteHandler: MCPToolHandler = async (
SQ|  params: Record<string, unknown>,
SQ|  context: MCPContext
): Promise<MCPResponse> => {
SQ|  const sdk = context.sdk as VivimSDK | undefined;
SQ|  
SQ|  if (!sdk) {
SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({ error: 'SDK not initialized' }),
SQ|      }],
SQ|      isError: true,
SQ|    };
SQ|  }

SQ|  try {
SQ|    const wallet = sdk.wallet.getSmartWallet();
SQ|    if (!wallet) {
SQ|      return {
SQ|        content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({ error: 'No wallet initialized' }),
SQ|        }],
SQ|        isError: true,
SQ|      };
SQ|    }

SQ|    const to = params.to as string;
SQ|    const value = BigInt((params.value as string) || '0');
SQ|    const data = (params.data as string) || '0x';

SQ|    const txHash = await sdk.wallet.execute([{ to, value, data }]);

SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({
SQ|          success: true,
SQ|          transactionHash: txHash,
SQ|        }),
SQ|      }],
SQ|    };
SQ|  } catch (error) {
SQ|    return {
SQ|      content: [{
SQ|        type: 'text',
SQ|        text: JSON.stringify({
SQ|          error: error instanceof Error ? error.message : String(error),
SQ|        }),
SQ|      }],
SQ|      isError: true,
SQ|    };
SQ|  }
};

/**
 * Register all identity tools
 */
export function registerIdentityTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(identityInfoTool, identityInfoHandler);
  registry.register(identityCreateTool, identityCreateHandler);
  registry.register(signDataTool, signDataHandler);
registry.register(verifySignatureTool, verifySignatureHandler);
SB|  // Wallet tools
SQ|  registry.register(walletInfoTool, walletInfoHandler);
SQ|  registry.register(walletCreateTool, walletCreateHandler);
SQ|  registry.register(walletExecuteTool, walletExecuteHandler);
}
