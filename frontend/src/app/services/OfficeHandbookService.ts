import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  OfficeHandbook,
  CreateOfficeHandbook,
  UpdateOfficeHandbook,
  OfficeHandbookCategory,
  CreateOfficeHandbookCategory,
  UpdateOfficeHandbookCategory,
} from '../models/OfficeHandbook';

@Injectable({
  providedIn: 'root',
})
export class OfficeHandbookService {
  private http = inject(HttpClient);

  // API URL
  private readonly apiUrl = `${environment.ApiBaseUrl}/OfficeHandbook`;

  // =========================================================
  // HANDBOOK ARTICLES
  // =========================================================

  // GET: api/OfficeHandbook
  GetHandbooks(): Observable<OfficeHandbook[]> {
    return this.http.get<OfficeHandbook[]>(this.apiUrl);
  }

  // GET: api/OfficeHandbook/{id}
  GetHandbookById(id: string): Observable<OfficeHandbook> {
    return this.http.get<OfficeHandbook>(`${this.apiUrl}/${id}`);
  }

  // GET: api/OfficeHandbook/slug/{slug}
  GetHandbookBySlug(slug: string): Observable<OfficeHandbook> {
    return this.http.get<OfficeHandbook>(
      `${this.apiUrl}/slug/${encodeURIComponent(slug)}`,
    );
  }

  // POST: api/OfficeHandbook
  CreateHandbook(data: CreateOfficeHandbook): Observable<OfficeHandbook> {
    return this.http.post<OfficeHandbook>(this.apiUrl, data);
  }

  // POST: api/OfficeHandbook/upload-image
  UploadImage(file: File): Observable<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string; fileName: string }>(
      `${this.apiUrl}/upload-image`,
      formData,
    );
  }

  // PUT: api/OfficeHandbook/{id}
  UpdateHandbook(
    id: string,
    data: UpdateOfficeHandbook,
  ): Observable<OfficeHandbook> {
    return this.http.put<OfficeHandbook>(`${this.apiUrl}/${id}`, data);
  }

  // DELETE: api/OfficeHandbook/{id}
  // Soft delete / archive
  ArchiveHandbook(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =========================================================
  // HANDBOOK CATEGORIES
  // =========================================================

  // GET: api/OfficeHandbook/categories
  GetCategories(): Observable<OfficeHandbookCategory[]> {
    return this.http.get<OfficeHandbookCategory[]>(`${this.apiUrl}/categories`);
  }

  // POST: api/OfficeHandbook/categories
  CreateCategory(
    data: CreateOfficeHandbookCategory,
  ): Observable<OfficeHandbookCategory> {
    return this.http.post<OfficeHandbookCategory>(
      `${this.apiUrl}/categories`,
      data,
    );
  }

  RestoreHandbook(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/restore`, {});
  }

  // PUT: api/OfficeHandbook/categories/{id}
  UpdateCategory(
    id: string,
    data: UpdateOfficeHandbookCategory,
  ): Observable<OfficeHandbookCategory> {
    return this.http.put<OfficeHandbookCategory>(
      `${this.apiUrl}/categories/${id}`,
      data,
    );
  }
}
