import { Injectable, Provider } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HTTP_INTERCEPTORS,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStore } from '@angular-spotify/web/auth/data-access';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authStore: AuthStore) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const excludedUrls = ['https://accounts.spotify.com/api/token'];

    if (excludedUrls.includes(req.url)) {
      return next.handle(req).pipe(
        map((res: HttpEvent<any>) => {
          if (res instanceof HttpErrorResponse) {
            console.error('Non 200 response received:', res.status);
            throw new Error(`Non 200 response received: ${res.status}`);
          }
          return res;
        })
      );
    }

    return this.authStore.token$.pipe(
      take(1),
      switchMap((token) => {
        if (!token) {
          return next.handle(req);
        }
        const headers = req.headers.set('Authorization', `Bearer ${token}`);
        const authReq = req.clone({
          headers
        });
        return next.handle(authReq);
      })
    );
  }
}

export const authInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
};
