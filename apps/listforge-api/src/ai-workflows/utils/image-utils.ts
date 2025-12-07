/**
 * Image URL utilities for AI workflows
 * Handles conversion of local URLs to base64 for OpenAI API compatibility
 */

/**
 * Check if a URL is a local URL that OpenAI can't access
 */
export function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname === 'host.docker.internal'
    );
  } catch {
    return false;
  }
}

/**
 * Fetch an image and convert to base64 data URI
 */
export async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to convert image to base64: ${url}. ${errorMessage}`);
  }
}

/**
 * Prepare image URLs for OpenAI - convert local URLs to base64
 */
export async function prepareImageUrls(urls: string[]): Promise<string[]> {
  return Promise.all(
    urls.map(async (url) => {
      if (isLocalUrl(url)) {
        console.debug(`Converting local URL to base64: ${url}`);
        return imageToBase64(url);
      }
      return url;
    })
  );
}
