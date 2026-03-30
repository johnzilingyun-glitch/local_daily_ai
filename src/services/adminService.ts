export async function getHistoryContext(): Promise<any[]> {
  try {
    // Add cache-buster to avoid getting cached HTML fallback pages
    const response = await fetch(`/api/history/context?t=${Date.now()}`);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML instead of JSON for history context. This might be a redirect or fallback.');
        return [];
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse history context JSON. Response text:', text.substring(0, 500));
        throw parseErr;
      }
    } else {
      const errorText = await response.text();
      console.error(`Failed to fetch history context: ${response.status} ${response.statusText}`, errorText.substring(0, 500));
    }
  } catch (err) {
    console.error('Failed to fetch history context:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
  }
  return [];
}

export async function saveAnalysisToHistory(type: 'market' | 'stock', data: any) {
  try {
    const response = await fetch('/api/history/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save analysis');
    }
  } catch (err) {
    console.error('Failed to save analysis to history:', err);
  }
}

export async function logOptimization(field: string, oldValue: any, newValue: any, description: string) {
  try {
    await fetch('/api/logs/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, oldValue, newValue, description })
    });
  } catch (err) {
    console.error('Failed to log optimization:', err);
  }
}
