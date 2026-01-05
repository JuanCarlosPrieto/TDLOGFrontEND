import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Subscription, interval, switchMap, takeWhile, catchError, of } from 'rxjs';

import { MatchmakingService, FindMatchResponse } from '../../services/MatchMaking/matchmaking-service';
import { WebsocketService, WsMessage } from '../../services/WebSocket/websocket-service';

import { Board as BoardComponent } from '../game/board/board';
import { CellInterface, PlayerColor, PieceInterface } from '../game/chekcers.model';

type PageState = 'idle' | 'finding' | 'waiting' | 'playing' | 'error';
type Role = 'white' | 'black';

type Move = {
  from: [number, number];
  to: [number, number];
  capture?: [number, number]; // celda capturada (si aplica)
};


@Component({
  selector: 'app-playpage',
  standalone: true,
  imports: [CommonModule, BoardComponent],
  templateUrl: './playpage.html',
  styleUrl: './playpage.css'
})
export class Playpage {
  state: PageState = 'idle';

  match?: FindMatchResponse['match'];
  role?: Role;

  log: string[] = [];
  private sub = new Subscription();

  nextTurn?: Role;

  get myTurn(): boolean {
    return !!this.role && !!this.nextTurn && this.role === this.nextTurn;
  }

  board: CellInterface[][] = this.createInitialBoard();
  selectedCell: CellInterface | null = null;

  get playerColor(): PlayerColor {
    if (!this.role) return 'RED';
    return this.role === 'white' ? 'RED' : 'BLACK';
  }

  constructor(
    private matchmaking: MatchmakingService,
    private socket: WebsocketService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  onFindMatch(): void {
    this.state = 'finding';
    this.log = ['Finding match...'];

    this.sub.add(
      this.matchmaking.findMatch().subscribe({
        next: (res) => {
          this.match = res.match;
          this.role = this.asRole(res.role);

          if (res.waiting) {
            this.state = 'waiting';
            this.log.push(`Waiting match #${res.match.matchid} as ${res.role}`);
            this.startPollingUntilOngoing();
          } else {
            this.state = 'playing';
            this.log.push(`Joined match #${res.match.matchid} as ${res.role}. Connecting WS...`);
            this.connectWs(res.match.matchid);
          }
        },
        error: (err) => {
          this.state = 'error';
          this.log.push(`Error finding match: ${this.errMsg(err)}`);
        }
      })
    );
  }

  private startPollingUntilOngoing() {
    this.sub.add(
      interval(2000).pipe(
        switchMap(() => this.matchmaking.findMatch()),
        takeWhile((res) => res.waiting, true),
        catchError((err) => {
          this.state = 'error';
          this.log.push(`Polling error: ${this.errMsg(err)}`);
          return of(null as any);
        })
      ).subscribe((res) => {
        if (!res) return;

        this.match = res.match;
        this.role = this.asRole(res.role);

        if (!res.waiting) {
          this.state = 'playing';
          this.log.push(`Opponent found. Connecting WS...`);
          this.connectWs(res.match.matchid);
        } else {
          this.log.push('Still waiting...');
        }
      })
    );
  }

  private connectWs(matchid: number) {
    this.sub.add(
      this.socket.connect(matchid).subscribe((msg: WsMessage) => {
        this.zone.run(() => {
          if (msg.type === 'sync') {
            this.role = this.asRole(msg.payload?.your_role);
            this.nextTurn = this.asRole(msg.payload?.next_turn);

            let b = this.createInitialBoard();
            const moves = msg.payload?.moves ?? [];
            for (const m of moves) {
              b = this.applyMoveToBoard(b, m.move);
            }
            this.board = b;

            this.selectedCell = null;
            this.log.push(`SYNC: moves=${moves.length}`);
          }

          if (msg.type === 'move') {
            this.nextTurn = this.asRole(msg.payload?.next_turn);
            this.board = this.applyMoveToBoard(this.board, msg.payload?.move);

            const mustContinue = !!msg.payload?.must_continue;

            if (mustContinue) {
              // mantener selección en la nueva posición
              const [tr, tc] = msg.payload.move.to as [number, number];
              this.selectedCell = this.board[tr][tc];
              this.forcedChain = { row: tr, col: tc };
              this.log.push(`CAPTURE: continue chain`);
            } else {
              this.selectedCell = null;
              this.forcedChain = null;
            }

            this.log.push(`MOVE #${msg.payload?.move_number} by ${msg.payload?.player}`);
          }

          if (msg.type === 'error') {
            this.log.push(`WS ERROR: ${msg.payload?.detail}`);
          }

          if (msg.type === 'match_finished') {
            this.log.push(`MATCH FINISHED: result=${msg.payload?.result} reason=${msg.payload?.reason}`);
            this.nextTurn = undefined;
            this.selectedCell = null;
            this.forcedChain = null;

            // optional: show UI, redirect, etc.
            this.socket.disconnect(); // or let server close you
          }

          this.cdr.detectChanges();
        });
      })
    );
  }

  onCellClick(cell: CellInterface) {
    if (this.state !== 'playing') return;
    if (!this.myTurn) return;

    const me = this.playerColor;

    if (this.forcedChain) {
      const { row, col } = this.forcedChain;
      if (!this.selectedCell) {
        this.selectedCell = this.board[row][col]; 
      } else if (this.selectedCell.row !== row || this.selectedCell.col !== col) {
        this.selectedCell = this.board[row][col];
      }
    }

    if (!this.selectedCell) {
      if (!cell.piece) return;
      if (!this.isMyPiece(cell.piece)) return;

      const all = this.getAllLegalMoves(this.board, me);
      const mustCapture = all.captures.length > 0;
      if (mustCapture) {
        const pm = this.getPieceMoves(this.board, cell.row, cell.col, me);
        if (pm.captures.length === 0) return; // no puede capturar => no seleccionable
      }

      this.selectedCell = cell;
      return;
    }

    // permitir re-selección de tu pieza (si no estás en cadena forzada)
    if (!this.forcedChain && cell.piece && this.isMyPiece(cell.piece)) {
      this.selectedCell = cell;
      return;
    }

    // 2) intentar mover
    const legal = this.getLegalMovesForSelected(this.board, this.selectedCell, me);
    const attempt: Move = {
      from: [this.selectedCell.row, this.selectedCell.col],
      to: [cell.row, cell.col],
    };

    const ok = legal.some(m => this.sameMove(m, attempt));
    if (!ok) return;

    this.socket.sendMove(attempt);

    // IMPORTANTÍSIMO:
    // No limpies selectedCell aquí si hay captura y puede haber multi-jump,
    // porque la confirmación real llega por WS.
  }

  private isMyPiece(piece: PieceInterface): boolean {
    return piece.color === this.playerColor;
  }

  private asRole(v: any): Role | undefined {
    const s = String(v ?? '').toLowerCase();
    return (s === 'white' || s === 'black') ? (s as Role) : undefined;
  }

  private createInitialBoard(): CellInterface[][] {
    const board: CellInterface[][] = [];
    let idCounter = 1;

    for (let r = 0; r < 8; r++) {
      const row: CellInterface[] = [];
      for (let c = 0; c < 8; c++) {
        const playable = (r + c) % 2 === 1;
        let piece: PieceInterface | null = null;

        if (playable && r < 3) {
          piece = { id: idCounter++, color: 'BLACK', isKing: false };
        }
        if (playable && r > 4) {
          piece = { id: idCounter++, color: 'RED', isKing: false };
        }

        row.push({ row: r, col: c, playable, piece });
      }
      board.push(row);
    }

    return board;
  }

  private applyMoveToBoard(board: CellInterface[][], move: any): CellInterface[][] {
    if (!move) return board;

    const next = board.map(row =>
      row.map(cell => ({ ...cell, piece: cell.piece ? { ...cell.piece } : null }))
    );

    const [fr, fc] = move.from as [number, number];
    const [tr, tc] = move.to as [number, number];

    const piece = next[fr][fc].piece;
    if (!piece) return board;

    next[fr][fc].piece = null;
    next[tr][tc].piece = piece;

    // captura simple
    if (Math.abs(tr - fr) === 2 && Math.abs(tc - fc) === 2) {
      const mr = (fr + tr) / 2;
      const mc = (fc + tc) / 2;
      next[mr][mc].piece = null;
    }

    // coronación
    if (piece.color === 'RED' && tr === 0) piece.isKing = true;
    if (piece.color === 'BLACK' && tr === 7) piece.isKing = true;

    return next;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.socket.disconnect();
  }

  private errMsg(err: any) {
    return err?.error?.detail ?? err?.message ?? JSON.stringify(err);
  }


  // Reglas del juego
  private forcedChain: { row: number; col: number } | null = null; // si hay multi-captura en curso

  private inBounds(r: number, c: number): boolean {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  private isOpponentPiece(piece: PieceInterface, me: PlayerColor): boolean {
    return piece.color !== me;
  }

  private forwardDir(color: PlayerColor): number {
    // RED empieza abajo (r>4) y sube hacia r=0
    return color === 'RED' ? -1 : +1;
  }

  private getPieceMoves(board: CellInterface[][], r: number, c: number, me: PlayerColor): { steps: Move[]; captures: Move[] } {
    const cell = board[r][c];
    const piece = cell.piece;
    if (!piece) return { steps: [], captures: [] };
    if (piece.color !== me) return { steps: [], captures: [] };

    const dirs: Array<[number, number]> = [];

    if (piece.isKing) {
      dirs.push([-1, -1], [-1, +1], [+1, -1], [+1, +1]);
    } else {
      const dr = this.forwardDir(me);
      dirs.push([dr, -1], [dr, +1]);
    }

    const steps: Move[] = [];
    const captures: Move[] = [];

    for (const [dr, dc] of dirs) {
      // step
      const r1 = r + dr, c1 = c + dc;
      if (this.inBounds(r1, c1) && board[r1][c1].playable && !board[r1][c1].piece) {
        steps.push({ from: [r, c], to: [r1, c1] });
      }

      // capture
      const r2 = r + 2 * dr, c2 = c + 2 * dc;
      if (!this.inBounds(r2, c2)) continue;
      if (!board[r2][c2].playable || board[r2][c2].piece) continue;

      const midR = r + dr, midC = c + dc;
      const midPiece = board[midR][midC].piece;
      if (midPiece && this.isOpponentPiece(midPiece, me)) {
        captures.push({ from: [r, c], to: [r2, c2], capture: [midR, midC] });
      }
    }

    return { steps, captures };
  }

  private getAllLegalMoves(board: CellInterface[][], me: PlayerColor): { steps: Move[]; captures: Move[] } {
    const steps: Move[] = [];
    const captures: Move[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (!cell.piece) continue;
        if (cell.piece.color !== me) continue;

        const pm = this.getPieceMoves(board, r, c, me);
        steps.push(...pm.steps);
        captures.push(...pm.captures);
      }
    }

    return { steps, captures };
  }

  private getLegalMovesForSelected(board: CellInterface[][], sel: CellInterface, me: PlayerColor): Move[] {
    const all = this.getAllLegalMoves(board, me);

    // Regla: captura obligatoria
    const mustCapture = all.captures.length > 0;

    const pm = this.getPieceMoves(board, sel.row, sel.col, me);
    return mustCapture ? pm.captures : pm.steps;
  }

  private sameMove(a: Move, b: Move): boolean {
    return a.from[0] === b.from[0] && a.from[1] === b.from[1] && a.to[0] === b.to[0] && a.to[1] === b.to[1];
  }

  private isCaptureMove(m: Move): boolean {
    return Math.abs(m.to[0] - m.from[0]) === 2 && Math.abs(m.to[1] - m.from[1]) === 2;
  }
}