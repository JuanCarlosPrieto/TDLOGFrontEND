import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Piece } from '../piece/piece';
import { CellInterface } from '../../game/chekcers.model';

@Component({
  selector: 'app-cell',
  imports: [CommonModule, Piece],
  templateUrl: './cell.html',
  styleUrl: './cell.css'
})
export class Cell {
  @Input({required: true}) cell!: CellInterface;
  @Input() isSelected: boolean = false;

  @Output() cellClick = new EventEmitter<CellInterface>();

  handleClick() {
    this.cellClick.emit(this.cell);
  }
}
