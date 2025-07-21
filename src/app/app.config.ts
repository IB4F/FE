import {ApplicationConfig, ENVIRONMENT_INITIALIZER, importProvidersFrom} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration} from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors} from "@angular/common/http";
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {jwtInterceptor} from "./interceptors/jwt.interceptor";
import {refreshTokenInterceptor} from "./interceptors/refresh-token.interceptor";
import {errorInterceptor} from "./interceptors/error.interceptor";
import {appInitializer} from "./services/app-initializer.service";
import {ApiModule, Configuration} from "./api-client";
import {loaderInterceptor} from "./interceptors/loader.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({scrollPositionRestoration: 'top', anchorScrolling: 'enabled',})),
    provideHttpClient(
      withInterceptors([
        loaderInterceptor,
        jwtInterceptor,
        refreshTokenInterceptor,
        errorInterceptor,
      ]), withFetch()
    ),
    provideAnimationsAsync(),
    importProvidersFrom(
      ApiModule.forRoot(() => new Configuration())
    ),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: appInitializer
    }
  ]
};
