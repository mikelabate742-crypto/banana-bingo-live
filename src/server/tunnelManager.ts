import { spawn, execSync, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let activeTunnelUrl = '';
let tunnelProcess: ChildProcess | null = null;
let onUrlChangeCallback: ((url: string) => void) | null = null;

const PERSISTENT_URL_FILE = path.resolve('./public_tunnel_url.txt');

export function onTunnelUrlChange(cb: (url: string) => void) {
  onUrlChangeCallback = cb;
}

export function getPublicWebAppUrl(): string {
  if (activeTunnelUrl) {
    return activeTunnelUrl;
  }
  if (fs.existsSync(PERSISTENT_URL_FILE)) {
    try {
      const saved = fs.readFileSync(PERSISTENT_URL_FILE, 'utf-8').trim();
      if (saved && saved.startsWith('https://')) {
        activeTunnelUrl = saved;
        return activeTunnelUrl;
      }
    } catch (e) {}
  }
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL;
  }
  return '';
}

function ensureCloudflaredBinary(): string {
  const binDir = path.resolve('./bin');
  const binPath = path.resolve(binDir, 'cloudflared');

  if (fs.existsSync(binPath)) {
    return binPath;
  }

  try {
    console.log('[Tunnel] Downloading cloudflared binary...');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    execSync(
      'curl -sSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ./bin/cloudflared && chmod +x ./bin/cloudflared',
      { stdio: 'inherit' }
    );
    console.log('[Tunnel] cloudflared downloaded successfully!');
    return binPath;
  } catch (err: any) {
    console.error('[Tunnel] Failed to auto-download cloudflared:', err.message);
    return binPath;
  }
}

export function startPublicTunnel(port: number = 3000): Promise<string> {
  return new Promise((resolve) => {
    if (activeTunnelUrl && tunnelProcess && !tunnelProcess.killed) {
      return resolve(activeTunnelUrl);
    }

    const binPath = ensureCloudflaredBinary();
    if (!fs.existsSync(binPath)) {
      console.warn('[Tunnel] cloudflared binary not found at', binPath);
      return resolve(getPublicWebAppUrl());
    }

    try {
      try {
        execSync('killall -9 cloudflared 2>/dev/null || true');
      } catch (e) {}

      console.log('[Tunnel] Starting Cloudflare Tunnel on port', port);
      tunnelProcess = spawn(
        binPath,
        ['tunnel', '--url', `http://localhost:${port}`, '--protocol', 'http2', '--no-autoupdate'],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      let resolved = false;

      const handleData = (chunk: Buffer) => {
        const text = chunk.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && (!activeTunnelUrl || activeTunnelUrl !== match[0])) {
          activeTunnelUrl = match[0];
          console.log('[Tunnel] Public Telegram WebApp URL ready:', activeTunnelUrl);

          try {
            fs.writeFileSync(PERSISTENT_URL_FILE, activeTunnelUrl, 'utf-8');
          } catch (e) {}

          if (onUrlChangeCallback) {
            onUrlChangeCallback(activeTunnelUrl);
          }
          if (!resolved) {
            resolved = true;
            resolve(activeTunnelUrl);
          }
        }
      };

      tunnelProcess.stdout?.on('data', handleData);
      tunnelProcess.stderr?.on('data', handleData);

      tunnelProcess.on('error', (err) => {
        console.error('[Tunnel] Process error:', err);
        if (!resolved) {
          resolved = true;
          resolve(getPublicWebAppUrl());
        }
      });

      tunnelProcess.on('exit', (code) => {
        console.log('[Tunnel] Process exited with code', code);
        activeTunnelUrl = '';
        tunnelProcess = null;
        if (!resolved) {
          resolved = true;
          resolve(getPublicWebAppUrl());
        }
        setTimeout(() => {
          startPublicTunnel(port);
        }, 3000);
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(getPublicWebAppUrl());
        }
      }, 10000);
    } catch (err) {
      console.error('[Tunnel] Failed to spawn tunnel:', err);
      resolve(getPublicWebAppUrl());
    }
  });
}
