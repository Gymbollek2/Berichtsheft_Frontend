import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organigramm, Person, PersonCreateRequest, PersonUpdateRequest, Role } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/person';

  getAll(role?: Role): Observable<Person[]> {
    return this.http.get<Person[]>(this.url, { params: role ? { role } : {} });
  }

  getAzubis(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.url}/azubis`);
  }

  /** Ausbildungsorganigramm – für alle angemeldeten Personen. */
  getOrganigramm(): Observable<Organigramm> {
    return this.http.get<Organigramm>(`${this.url}/organigramm`);
  }

  getById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.url}/${id}`);
  }

  create(request: PersonCreateRequest): Observable<Person> {
    return this.http.post<Person>(this.url, request);
  }

  update(id: number, request: PersonUpdateRequest): Observable<Person> {
    return this.http.put<Person>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`);
  }

  resetPassword(id: number, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.url}/${id}/reset-password`, { newPassword });
  }
}
