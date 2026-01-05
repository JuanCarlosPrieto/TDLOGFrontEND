export type PlayerColor = 'RED' | 'BLACK';

export interface PieceInterface {
  id: number;
  color: PlayerColor;
  isKing: boolean;
}

export interface CellInterface {
  row: number;
  col: number;
  playable: boolean;
  piece: PieceInterface | null;
}