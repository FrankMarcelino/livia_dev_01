/**
 * Base n8n webhook client
 * All n8n calls MUST go through API Routes (never from client directly)
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL;

interface WebhookResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal function to call n8n webhooks
 * Should only be used in API Routes
 */
export async function callN8nWebhook<T = unknown>(
  webhookPath: string,
  payload: Record<string, unknown>,
  options?: { timeout?: number }
): Promise<WebhookResponse<T>> {
  if (!N8N_BASE_URL) {
    throw new Error('N8N_BASE_URL not configured');
  }

  const timeout = options?.timeout || 10000; // Default 10s timeout

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${N8N_BASE_URL}${webhookPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data: data as T };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: `n8n timeout after ${timeout}ms` };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
