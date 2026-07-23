import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map, of, tap } from 'rxjs';

export interface ModuleRouteEntry {
  id: string;
  name: string;
  code: string;
  routePrefix: string;
}

@Injectable({ providedIn: 'root' })
export class ModuleRegistryService {
  private readonly http = inject(HttpClient);
  private readonly _modules = signal<ModuleRouteEntry[]>([]);
  readonly modules = this._modules.asReadonly();

  ensureLoaded() {
    if (this._modules().length > 0) {
      return of(this._modules());
    }

    return this.http
      .get<ModuleRouteEntry[]>(
        `${environment.ApiBaseUrl}/SystemModule/route-registry`,
      )
      .pipe(
        map((rows) => (Array.isArray(rows) ? rows : [])),
        tap((rows) => this._modules.set(rows)),
        catchError((err) => {
          console.error('Failed to load module route registry', err);
          return of([]);
        }),
      );
  }

  /** Resolves permission matrix key (Code) from a navigated URL. */
  resolveModuleCodeFromUrl(url: string): string | null {
    const path = url.split('?')[0].toLowerCase();
    const segments = path.split('/').filter(Boolean);
    if (!segments.length) {
      return null;
    }

    const candidates = [
      segments.join('/'),
      segments.length > 1 ? `${segments[0]}/${segments[1]}` : segments[0],
      segments[0],
    ];

    const modules = this._modules();
    for (const candidate of candidates) {
      const match = modules.find((mod) => {
        const prefix = (mod.routePrefix || mod.code).toLowerCase();
        return prefix === candidate;
      });
      if (match) {
        return match.code;
      }
    }

    // e.g. /inventory/listing → module Code "inventory-listing" (no RoutePrefix required)
    if (segments.length >= 2) {
      const codeFromPath = `${segments[0]}-${segments[1]}`;
      const byCode = modules.find(
        (mod) => mod.code.toLowerCase() === codeFromPath,
      );
      if (byCode) {
        return byCode.code;
      }
    }

    return null;
  }

  invalidate() {
    this._modules.set([]);
  }
}
