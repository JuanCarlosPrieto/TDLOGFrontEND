import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type WsMessage =
  | { type: 'sync'; payload: any }
  | { type: 'move'; payload: any }
  | { type: 'pong'; payload: any }
  | { type: 'match_finished'; payload: any }
  | { type: 'error'; payload: { detail: string } };

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private ws?: WebSocket;
  private messages$ = new Subject<WsMessage>();

  constructor(private zone: NgZone) {}

  connect(matchid: number): Observable<WsMessage> {
    this.disconnect();

    const base = 'http://localhost:8000/api/v1'.replace(/^http/, 'ws');
    const url = `${base}/ws/match/${matchid}`;

    this.ws = new WebSocket(url);

    this.ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      this.zone.run(() => this.messages$.next(data));
    };

    this.ws.onerror = () => {
      this.zone.run(() =>
        this.messages$.next({ type: 'error', payload: { detail: 'WebSocket error' } } as any)
      );
    };

    this.ws.onclose = () => {};

    return this.messages$.asObservable();
  }

  sendMove(move: Record<string, any>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'move', payload: { move } }));
  }

  ping() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'ping', payload: {} }));
  }

  disconnect() {
    try { this.ws?.close(); } catch {}
    this.ws = undefined;
  }
}
