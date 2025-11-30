// Rate limiting utility for edge functions
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  entry.count++;
  return { allowed: true };
}

export async function trackUsage(
  supabaseClient: any,
  userId: string,
  functionName: string,
  tokensUsed: number = 1
) {
  try {
    await supabaseClient
      .from('user_usage')
      .insert({
        user_id: userId,
        function_name: functionName,
        tokens_used: tokensUsed
      });
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

export async function checkQuota(
  supabaseClient: any,
  userId: string,
  dailyLimit: number = 100
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .rpc('check_user_quota', {
        p_user_id: userId,
        p_daily_limit: dailyLimit
      });
    
    if (error) {
      console.error('Quota check error:', error);
      return true; // Allow on error to avoid blocking users
    }
    
    return data === true;
  } catch (error) {
    console.error('Quota check failed:', error);
    return true; // Allow on error
  }
}
