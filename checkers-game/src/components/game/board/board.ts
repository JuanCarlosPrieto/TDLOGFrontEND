import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CellInterface, PlayerColor } from '../chekcers.model';
import { CommonModule } from '@angular/common';
import { Cell } from '../cell/cell';

@Component({
  selector: 'app-board',
  imports: [CommonModule, Cell],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class Board {
  @Input({required: true}) board!: CellInterface[][];
  @Input() selectedCell: CellInterface | null = null;
  @Input() orientation: PlayerColor = 'RED';

  @Output() cellClick = new EventEmitter<CellInterface>();

  onCellClick(cell: CellInterface) {
    this.cellClick.emit(cell);
  }

  isCellSelected(cell: CellInterface): boolean {
    return (
      !!this.selectedCell &&
      this.selectedCell.row === cell.row &&
      this.selectedCell.col === cell.col
    );
  }
}
