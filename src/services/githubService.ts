export async function deployToGitHubPages(leadId: string, html: string): Promise<string | null> {
  try {
    const response = await fetch('/api/deploy-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ leadId, html }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.warn('GitHub deployment failed:', data.error || response.statusText);
      return null;
    }

    const data = await response.json();
    return data.previewUrl || null;
  } catch (error) {
    console.error('GitHub deployment failed via API proxy:', error);
    return null;
  }
}
