import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchDto {
  matchid: number;
  status: 'waiting' | 'ongoing' | 'finished' | string;
  whiteuser: number | null;
  blackuser: number | null;
  startedat?: string;
}

export interface FindMatchResponse {
  match: MatchDto;
  role: 'white' | 'black';
  waiting: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  private base = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  findMatch(): Observable<FindMatchResponse> {
    return this.http.post<FindMatchResponse>(`${this.base}/matchmaking/find`, {});
  }
}
