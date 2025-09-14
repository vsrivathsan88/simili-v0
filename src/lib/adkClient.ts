export type AdkEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'error'; error: any }
  | { type: 'text'; data: string }
  | { type: 'audio'; data: string };

export class AdkClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Array<(e: AdkEvent) => void> = [];

  constructor(url = (process.env.REACT_APP_ADK_WS_URL || 'ws://localhost:8787/ws')) {
    this.url = url;
  }

  on(listener: (e: AdkEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(e: AdkEvent) {
    this.listeners.forEach(l => l(e));
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          this.emit({ type: 'open' });
          resolve();
        };
        this.ws.onclose = () => this.emit({ type: 'close' });
        this.ws.onerror = (err) => this.emit({ type: 'error', error: err });
        this.ws.onmessage = (msg) => {
          try {
            const parsed = JSON.parse(msg.data as string);
            if (parsed.type === 'audio') this.emit({ type: 'audio', data: parsed.data });
            else this.emit({ type: 'text', data: parsed.data });
          } catch {
            this.emit({ type: 'text', data: String(msg.data) });
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  sendText(text: string) {
    this.ws?.send(JSON.stringify({ type: 'text', data: text }));
  }

  // Basic latency probe
  ping(): Promise<number> {
    return new Promise((resolve) => {
      const started = performance.now();
      const off = this.on((e) => {
        if (e.type === 'text' && e.data === 'pong') {
          off();
          resolve(performance.now() - started);
        }
      });
      this.ws?.send(JSON.stringify({ type: 'text', data: 'ping' }));
    });
  }
}
