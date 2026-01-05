import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellInterface, PieceInterface, PlayerColor } from '../chekcers.model';
import { Board } from '../board/board';

@Component({
  selector: 'app-gamepage',
  imports: [CommonModule, Board],
  templateUrl: './gamepage.html',
  styleUrl: './gamepage.css'
})
export class Gamepage {
  board: CellInterface[][] = [];
  selectedCell: CellInterface | null = null;
  currentPlayer: PlayerColor = 'RED';

  ngOnInit() {
    this.resetGame();
  }

  resetGame() {
    this.currentPlayer = 'RED';
    this.selectedCell = null;
    this.initBoard();
  }

  initBoard() {
    const size = 8;
    const board: CellInterface[][] = [];
    let id = 1;

    for (let row = 0; row < size; row++) {
      const boardRow: CellInterface[] = [];
      for (let col = 0; col < size; col++) {
        const playable = (row + col) % 2 === 1;
        let piece: PieceInterface | null = null;

        if (playable) {
          if (row < 3) {
            piece = { id: id++, color: 'BLACK', isKing: false };
          } else if (row > 4) {
            piece = { id: id++, color: 'RED', isKing: false };
          }
        }
        boardRow.push({ row, col, playable, piece });  
      }          
      board.push(boardRow);
    }

    this.board = board;
  }

  onCellClick(cell: CellInterface) {
    // Game logic to handle cell clicks will go here
    if (!this.selectedCell) {
      if (cell.piece && cell.piece.color === this.currentPlayer) {
        this.selectedCell = cell;
      }
      return;
    }

    if (this.selectedCell.row === cell.row && this.selectedCell.col === cell.col) {
      this.selectedCell = null;
      return;
    }
  }
}
