/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

// @ts-ignore
import { ConceptTagDTO } from '../model/conceptTagDTO';

// @ts-ignore
import { BASE_PATH } from '../variables';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';

@Injectable({
  providedIn: 'root'
})
export class ConceptTagsService extends BaseService {

  constructor(
    protected httpClient: HttpClient,
    @Optional() @Inject(BASE_PATH) basePath: string | string[],
    @Optional() configuration?: Configuration
  ) {
    super(basePath, configuration);
  }

  public apiConceptTagsGet(observe?: 'body', reportProgress?: boolean, options?: { context?: HttpContext }): Observable<ConceptTagDTO[]>;
  public apiConceptTagsGet(observe?: 'response', reportProgress?: boolean, options?: { context?: HttpContext }): Observable<HttpResponse<ConceptTagDTO[]>>;
  public apiConceptTagsGet(observe?: 'events', reportProgress?: boolean, options?: { context?: HttpContext }): Observable<HttpEvent<ConceptTagDTO[]>>;
  public apiConceptTagsGet(observe: any = 'body', reportProgress: boolean = false, options?: { context?: HttpContext }): Observable<any> {
    let localVarHeaders = this.defaultHeaders;
    localVarHeaders = this.configuration.addCredentialToHeaders('Bearer', 'Authorization', localVarHeaders, 'Bearer ');

    const localVarHttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;

    return this.httpClient.request<ConceptTagDTO[]>('get', `${basePath}/api/ConceptTags`, {
      context: localVarHttpContext,
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe,
      reportProgress
    });
  }

  public apiConceptTagsPost(body: { name: string }, observe: any = 'body', reportProgress: boolean = false, options?: { context?: HttpContext }): Observable<any> {
    let localVarHeaders = this.defaultHeaders;
    localVarHeaders = this.configuration.addCredentialToHeaders('Bearer', 'Authorization', localVarHeaders, 'Bearer ');
    localVarHeaders = localVarHeaders.set('Content-Type', 'application/json');

    const localVarHttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;

    return this.httpClient.request<ConceptTagDTO>('post', `${basePath}/api/ConceptTags`, {
      context: localVarHttpContext,
      body,
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe,
      reportProgress
    });
  }

  public apiConceptTagsPut(id: string, body: { name: string }, observe: any = 'body', reportProgress: boolean = false, options?: { context?: HttpContext }): Observable<any> {
    let localVarHeaders = this.defaultHeaders;
    localVarHeaders = this.configuration.addCredentialToHeaders('Bearer', 'Authorization', localVarHeaders, 'Bearer ');
    localVarHeaders = localVarHeaders.set('Content-Type', 'application/json');

    const localVarHttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;

    return this.httpClient.request<ConceptTagDTO>('put', `${basePath}/api/ConceptTags/${encodeURIComponent(id)}`, {
      context: localVarHttpContext,
      body,
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe,
      reportProgress
    });
  }

  public apiConceptTagsDelete(id: string, observe: any = 'body', reportProgress: boolean = false, options?: { context?: HttpContext }): Observable<any> {
    let localVarHeaders = this.defaultHeaders;
    localVarHeaders = this.configuration.addCredentialToHeaders('Bearer', 'Authorization', localVarHeaders, 'Bearer ');

    const localVarHttpContext = options?.context ?? new HttpContext();
    const { basePath, withCredentials } = this.configuration;

    return this.httpClient.request<any>('delete', `${basePath}/api/ConceptTags/${encodeURIComponent(id)}`, {
      context: localVarHttpContext,
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      headers: localVarHeaders,
      observe,
      reportProgress
    });
  }
}
