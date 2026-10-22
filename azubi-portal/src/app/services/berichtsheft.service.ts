import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BerichtsheftEintrag,
  BerichtsheftSaveRequest,
  Wochenbericht,
  WochenberichtSummary,
} from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class BerichtsheftService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/berichtsheft';

  getWoche(datum: string, personId?: number | null): Observable<Wochenbericht> {
    const params: Record<string, string> = { datum };
    if (personId) {
      params['personId'] = String(personId);
    }
    return this.http.get<Wochenbericht>(`${this.url}/woche`, { params });
  }

  getHistorie(personId?: number | null): Observable<WochenberichtSummary[]> {
    return this.http.get<WochenberichtSummary[]>(`${this.url}/historie`, {
      params: personId ? { personId: String(personId) } : {},
    });
  }

  saveEintrag(request: BerichtsheftSaveRequest): Observable<BerichtsheftEintrag> {
    return this.http.put<BerichtsheftEintrag>(`${this.url}/eintrag`, request);
  }

  deleteEintrag(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/eintrag/${id}`);
  }

  einreichen(datum: string): Observable<Wochenbericht> {
    return this.http.post<Wochenbericht>(`${this.url}/woche/einreichen`, { datum });
  }

  getOffen(): Observable<WochenberichtSummary[]> {
    return this.http.get<WochenberichtSummary[]>(`${this.url}/offen`);
  }

  /** Woche abnehmen (Endpunkt heißt aus Kompatibilitätsgründen weiter /abzeichnen). */
  abnehmen(id: number, kommentar: string | null): Observable<Wochenbericht> {
    return this.http.post<Wochenbericht>(`${this.url}/woche/${id}/abzeichnen`, { kommentar });
  }

  ablehnen(id: number, kommentar: string): Observable<Wochenbericht> {
    return this.http.post<Wochenbericht>(`${this.url}/woche/${id}/ablehnen`, { kommentar });
  }
}
