import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CsvImportResult, Lernziel, LernzielRequest } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class LernzielService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/lernziel';

  getAll(): Observable<Lernziel[]> {
    return this.http.get<Lernziel[]>(this.url);
  }

  getById(id: number): Observable<Lernziel> {
    return this.http.get<Lernziel>(`${this.url}/${id}`);
  }

  create(request: LernzielRequest): Observable<Lernziel> {
    return this.http.post<Lernziel>(this.url, request);
  }

  update(id: number, request: LernzielRequest): Observable<Lernziel> {
    return this.http.put<Lernziel>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.url}/export`, { responseType: 'blob' });
  }

  importCsv(file: File): Observable<CsvImportResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<CsvImportResult>(`${this.url}/import`, form);
  }
}
