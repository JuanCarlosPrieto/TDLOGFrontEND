import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PieceInterface } from '../../game/chekcers.model';

@Component({
  selector: 'app-piece',
  imports: [CommonModule],
  templateUrl: './piece.html',
  styleUrl: './piece.css'
})
export class Piece {
  @Input({required: true}) piece!: PieceInterface;
}
