export type Role = 'white' | 'black';
export type Piece = 'w' | 'b' | 'W' | 'B' | null; // minúscula normal, mayúscula king
export type Board = Piece[][];

export interface MovePayload {
  from: [number, number]; // [row, col] 0..7
  to: [number, number];
  // luego: captures?: [number, number][], promote?: boolean, etc.
}


export function applyMove(board: Board, move: MovePayload): Board {
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;

  const next: Board = board.map(row => row.slice());
  const piece = next[fr][fc];
  next[fr][fc] = null;
  next[tr][tc] = piece;

  // captura simple si saltó 2 casillas
  if (Math.abs(tr - fr) === 2 && Math.abs(tc - fc) === 2) {
    const mr = (fr + tr) / 2;
    const mc = (fc + tc) / 2;
    next[mr][mc] = null;
  }

  // coronación mínima
  if (piece === 'w' && tr === 0) next[tr][tc] = 'W';
  if (piece === 'b' && tr === 7) next[tr][tc] = 'B';

  return next;
}
