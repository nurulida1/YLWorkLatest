import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly _isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this._isLoading.asObservable();

  setLoading(isLoading: boolean) {
    this._isLoading.next(isLoading);
  }

  start() {
    this._isLoading.next(true);
  }

  stop() {
    this._isLoading.next(false);
  }
}
