import { APP_VERSION } from '../version';

interface VersionManifest {
  version?: unknown;
}

const VERSION_CHECK_PATH = '/version.json';

export class AppUpdateService {
  private notifiedVersion: string | null = null;
  private checking = false;

  async check(): Promise<string | null> {
    if (this.checking || typeof window === 'undefined' || !navigator.onLine) return null;

    this.checking = true;
    try {
      const response = await fetch(`${VERSION_CHECK_PATH}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;

      const manifest = (await response.json()) as VersionManifest;
      const publishedVersion = typeof manifest.version === 'string' ? manifest.version : null;
      if (
        !publishedVersion ||
        publishedVersion === APP_VERSION ||
        publishedVersion === this.notifiedVersion
      ) {
        return null;
      }

      this.notifiedVersion = publishedVersion;
      return publishedVersion;
    } catch {
      return null;
    } finally {
      this.checking = false;
    }
  }

  start(onUpdate: (version: string) => void): () => void {
    const check = () => {
      void this.check().then((version) => {
        if (version) onUpdate(version);
      });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check();
    };
    const onOnline = () => check();

    check();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }
}

export const appUpdateService = new AppUpdateService();
