import type { WorldSnapshot } from '@shared/types';

type StatusCallback = (msg: string) => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private latestSnapshot: WorldSnapshot | null = null;
  private onStatus: StatusCallback;

  constructor(onStatus: StatusCallback) {
    this.onStatus = onStatus;
  }

  connect(url: string): void {
    if (this.socket) {
      this.socket.close();
    }
    this.onStatus(`Connecting to ${url}…`);
    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => this.onStatus('WebSocket connected');

    ws.onmessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? e.data : '';
        const snapshot = JSON.parse(data) as WorldSnapshot;
        // Latest-only: just overwrite; animation loop reads and clears
        this.latestSnapshot = snapshot;
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => this.onStatus('WebSocket disconnected');
    ws.onerror = () => this.onStatus('WebSocket error');
  }

  /** Returns the latest snapshot and clears the buffer. Returns null if no new snapshot. */
  getLatestAndClear(): WorldSnapshot | null {
    const s = this.latestSnapshot;
    this.latestSnapshot = null;
    return s;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }
}
