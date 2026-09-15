export function getSocketBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return window.location.origin;
  }
  return 'http://localhost:8000';
}
