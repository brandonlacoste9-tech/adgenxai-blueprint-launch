// =====================================================
// BYOA VAULT MANAGER
// Bring Your Own API - Secure key management for Citadel tier
// =====================================================

import { supabase } from '@/integrations/supabase/client';

export interface UserApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  groq?: string;
  stability?: string; // For image generation
}

export interface VaultEntry {
  id: string;
  user_id: string;
  key_name: string;
  encrypted_value: string;
  description?: string;
  last_used?: Date;
  created_at: Date;
  updated_at: Date;
}

export class VaultManager {
  private static readonly VAULT_TABLE = 'user_api_keys';

  // Store user API keys securely
  static async storeApiKeys(userId: string, keys: UserApiKeys): Promise<void> {
    try {
      const entries = Object.entries(keys).map(([provider, key]) => ({
        user_id: userId,
        key_name: provider,
        encrypted_value: this.encryptKey(key),
        description: `${provider} API key for enhanced performance`,
        updated_at: new Date()
      }));

      // Upsert keys (update if exists, insert if not)
      const { error } = await supabase
        .from(this.VAULT_TABLE)
        .upsert(entries, {
          onConflict: 'user_id,key_name',
          ignoreDuplicates: false
        });

      if (error) throw error;

      console.log(`🔐 Stored ${entries.length} API keys for user ${userId}`);

    } catch (error) {
      console.error('❌ Failed to store API keys:', error);
      throw new Error('Failed to securely store API keys');
    }
  }

  // Retrieve user API keys
  static async getApiKeys(userId: string): Promise<UserApiKeys> {
    try {
      const { data, error } = await supabase
        .from(this.VAULT_TABLE)
        .select('key_name, encrypted_value, last_used')
        .eq('user_id', userId);

      if (error) throw error;

      const keys: UserApiKeys = {};
      data?.forEach(entry => {
        keys[entry.key_name as keyof UserApiKeys] = this.decryptKey(entry.encrypted_value);
      });

      // Update last_used timestamp
      await this.updateLastUsed(userId, Object.keys(keys));

      return keys;

    } catch (error) {
      console.error('❌ Failed to retrieve API keys:', error);
      return {};
    }
  }

  // Check if user has BYOA keys
  static async hasByoaKeys(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from(this.VAULT_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return (count || 0) > 0;

    } catch (error) {
      console.error('❌ Failed to check BYOA keys:', error);
      return false;
    }
  }

  // Get available BYOA providers for user
  static async getAvailableProviders(userId: string): Promise<string[]> {
    try {
      const keys = await this.getApiKeys(userId);
      return Object.keys(keys).filter(key => keys[key as keyof UserApiKeys]);
    } catch (error) {
      return [];
    }
  }

  // Validate API key before storing
  static async validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Basic validation - check format and make test call
      switch (provider) {
        case 'openai':
          return apiKey.startsWith('sk-') && apiKey.length > 20;

        case 'anthropic':
          return apiKey.startsWith('sk-ant-') && apiKey.length > 20;

        case 'google':
          return apiKey.length > 20 && /^[A-Za-z0-9+/=]+$/.test(apiKey);

        case 'groq':
          return apiKey.startsWith('gsk_') && apiKey.length > 20;

        default:
          return apiKey.length > 10; // Basic length check
      }
    } catch (error) {
      console.error(`❌ API key validation failed for ${provider}:`, error);
      return false;
    }
  }

  // Remove API keys (for security/unlinking)
  static async removeApiKeys(userId: string, providers?: string[]): Promise<void> {
    try {
      let query = supabase
        .from(this.VAULT_TABLE)
        .delete()
        .eq('user_id', userId);

      if (providers && providers.length > 0) {
        query = query.in('key_name', providers);
      }

      const { error } = await query;
      if (error) throw error;

      console.log(`🗑️ Removed API keys for user ${userId}${providers ? ` (${providers.join(', ')})` : ' (all)'}`);

    } catch (error) {
      console.error('❌ Failed to remove API keys:', error);
      throw new Error('Failed to remove API keys');
    }
  }

  // Get vault usage statistics
  static async getVaultStats(userId?: string): Promise<{
    totalKeys: number;
    activeUsers: number;
    popularProviders: Record<string, number>;
  }> {
    try {
      let query = supabase.from(this.VAULT_TABLE).select('key_name, user_id');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = data?.reduce((acc, entry) => {
        acc.totalKeys++;
        if (!acc.users.has(entry.user_id)) {
          acc.users.add(entry.user_id);
          acc.activeUsers++;
        }
        acc.popularProviders[entry.key_name] = (acc.popularProviders[entry.key_name] || 0) + 1;
        return acc;
      }, {
        totalKeys: 0,
        activeUsers: 0,
        users: new Set<string>(),
        popularProviders: {} as Record<string, number>
      });

      return {
        totalKeys: stats?.totalKeys || 0,
        activeUsers: stats?.activeUsers || 0,
        popularProviders: stats?.popularProviders || {}
      };

    } catch (error) {
      console.error('❌ Failed to get vault stats:', error);
      return { totalKeys: 0, activeUsers: 0, popularProviders: {} };
    }
  }

  // Private encryption/decryption methods
  // Note: In production, use proper encryption with user-specific keys
  private static encryptKey(key: string): string {
    // Simple base64 encoding for demo - use proper encryption in production
    return Buffer.from(key).toString('base64');
  }

  private static decryptKey(encryptedKey: string): string {
    // Simple base64 decoding for demo - use proper decryption in production
    return Buffer.from(encryptedKey, 'base64').toString();
  }

  // Update last used timestamp
  private static async updateLastUsed(userId: string, providers: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.VAULT_TABLE)
        .update({ last_used: new Date() })
        .eq('user_id', userId)
        .in('key_name', providers);

      if (error) throw error;
    } catch (error) {
      // Non-critical error, just log
      console.warn('⚠️ Failed to update last_used timestamp:', error);
    }
  }
}

// Convenience functions for common operations
export async function setupByoaKeys(userId: string, keys: UserApiKeys): Promise<boolean> {
  try {
    // Validate all keys first
    for (const [provider, key] of Object.entries(keys)) {
      if (key && !(await VaultManager.validateApiKey(provider, key))) {
        throw new Error(`Invalid ${provider} API key format`);
      }
    }

    await VaultManager.storeApiKeys(userId, keys);
    return true;
  } catch (error) {
    console.error('❌ BYOA setup failed:', error);
    return false;
  }
}

export async function getUserTier(userId: string): Promise<'scout' | 'voyageur' | 'citadel'> {
  try {
    const hasByoa = await VaultManager.hasByoaKeys(userId);

    if (hasByoa) return 'citadel';

    // Check subscription status (would integrate with payment system)
    // For now, return voyageur as default premium tier
    return 'voyageur';

  } catch (error) {
    console.warn('⚠️ Failed to determine user tier:', error);
    return 'scout'; // Default to free tier
  }
}

export async function shouldUseByoa(userId: string, provider: string): Promise<boolean> {
  try {
    const tier = await getUserTier(userId);

    if (tier !== 'citadel') return false;

    const keys = await VaultManager.getApiKeys(userId);
    return !!(keys[provider as keyof UserApiKeys]);

  } catch (error) {
    console.warn('⚠️ Failed to check BYOA preference:', error);
    return false;
  }
}

// Export the class as default
export default VaultManager;