import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject} from '@angular/core';
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
import {INITIAL_LANGUAGE, parseLangCookie} from "./tokens/language.token";
import {TranslationService} from "./services/translation.service";
import {loaderInterceptor} from "./interceptors/loader.interceptor";
import {QuillModule} from "ngx-quill";

export const appConfig: ApplicationConfig = {
  providers: [
    // Provide the initial language from the cookie (browser-side)
    {
      provide: INITIAL_LANGUAGE,
      useFactory: () => parseLangCookie(
        typeof document !== 'undefined' ? document.cookie : undefined
      )
    },
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
      ApiModule.forRoot(() => new Configuration({ withCredentials: true })),
      QuillModule.forRoot()
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: appInitializer
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const translation = inject(TranslationService);
        return () => translation.init();
      }
    }
  ]
};
