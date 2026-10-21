import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fortschritt, LernzielStatus, PersonLernziel } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class PersonLernzielService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/personLernziel';

  getMine(): Observable<PersonLernziel[]> {
    return this.http.get<PersonLernziel[]>(`${this.url}/me`);
  }

  getMyProgress(): Observable<Fortschritt> {
    return this.http.get<Fortschritt>(`${this.url}/me/fortschritt`);
  }

  getForPerson(personId: number): Observable<PersonLernziel[]> {
    return this.http.get<PersonLernziel[]>(`${this.url}/person/${personId}`);
  }

  getProgress(personId: number): Observable<Fortschritt> {
    return this.http.get<Fortschritt>(`${this.url}/person/${personId}/fortschritt`);
  }

  getProgressAll(): Observable<Fortschritt[]> {
    return this.http.get<Fortschritt[]>(`${this.url}/fortschritt`);
  }

  setStatus(id: number, status: LernzielStatus): Observable<PersonLernziel> {
    return this.http.put<PersonLernziel>(`${this.url}/${id}/status`, { status });
  }
}
