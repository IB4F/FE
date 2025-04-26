import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration} from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors} from "@angular/common/http";
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {jwtInterceptor} from "./interceptors/jwt.interceptor";
import {refreshTokenInterceptor} from "./interceptors/refresh-token.interceptor";
import {errorInterceptor} from "./interceptors/error.interceptor";
import {ApiModule, Configuration} from "./api-client/auth";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,
        refreshTokenInterceptor,
        errorInterceptor
      ])
      , withFetch()
    ),
    provideAnimationsAsync(),
    importProvidersFrom(
      ApiModule.forRoot(() => new Configuration())
    ),
  ]
};
