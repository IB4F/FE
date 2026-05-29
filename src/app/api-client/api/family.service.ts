/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ChildCreatedDto } from '../model/childCreatedDto';
import { ChildPasswordResetResponseDto } from '../model/childPasswordResetResponseDto';
import { ChildSummaryDto } from '../model/childSummaryDto';
import { CreateChildInputDto } from '../model/createChildInputDto';
import { CreateChildrenBulkRequestDto } from '../model/createChildrenBulkRequestDto';
import { CreateChildrenBulkResponseDto } from '../model/createChildrenBulkResponseDto';
import { UpdateChildDto } from '../model/updateChildDto';

import { BASE_PATH } from '../variables';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';

@Injectable({
  providedIn: 'root'
})
export class FamilyService extends BaseService {

  constructor(
    protected httpClient: HttpClient,
    @Optional() @Inject(BASE_PATH) basePath: string | string[],
    @Optional() configuration?: Configuration
  ) {
    super(basePath, configuration);
  }

  private get jsonHeaders(): HttpHeaders {
    let headers = this.defaultHeaders;
    headers = this.configuration.addCredentialToHeaders('Bearer', 'Authorization', headers, 'Bearer ');
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    return headers;
  }

  private get authHeaders(): HttpHeaders {
    let headers = this.defaultHeaders;
    headers = this.configuration.addCredentialToHeaders('Bearer', 'Authorization', headers, 'Bearer ');
    headers = headers.set('Accept', 'application/json');
    return headers;
  }

  public apiFamilyChildrenBulkPost(
    body: CreateChildrenBulkRequestDto,
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<CreateChildrenBulkResponseDto>;
  public apiFamilyChildrenBulkPost(
    body: CreateChildrenBulkRequestDto,
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<CreateChildrenBulkResponseDto>>;
  public apiFamilyChildrenBulkPost(
    body: CreateChildrenBulkRequestDto,
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<CreateChildrenBulkResponseDto>('post', `${basePath}/api/Family/children/bulk`, {
      body,
      headers: this.jsonHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }

  public apiFamilyChildrenGet(
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<{ children: ChildSummaryDto[] }>;
  public apiFamilyChildrenGet(
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<{ children: ChildSummaryDto[] }>>;
  public apiFamilyChildrenGet(
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<{ children: ChildSummaryDto[] }>('get', `${basePath}/api/Family/children`, {
      headers: this.authHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }

  public apiFamilyChildrenPost(
    body: CreateChildInputDto,
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<ChildCreatedDto>;
  public apiFamilyChildrenPost(
    body: CreateChildInputDto,
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<ChildCreatedDto>>;
  public apiFamilyChildrenPost(
    body: CreateChildInputDto,
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<ChildCreatedDto>('post', `${basePath}/api/Family/children`, {
      body,
      headers: this.jsonHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }

  public apiFamilyChildrenIdPatch(
    childId: string,
    body: UpdateChildDto,
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<ChildSummaryDto>;
  public apiFamilyChildrenIdPatch(
    childId: string,
    body: UpdateChildDto,
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<ChildSummaryDto>>;
  public apiFamilyChildrenIdPatch(
    childId: string,
    body: UpdateChildDto,
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<ChildSummaryDto>('patch', `${basePath}/api/Family/children/${encodeURIComponent(childId)}`, {
      body,
      headers: this.jsonHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }

  public apiFamilyChildrenIdPasswordResetPost(
    childId: string,
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<ChildPasswordResetResponseDto>;
  public apiFamilyChildrenIdPasswordResetPost(
    childId: string,
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<ChildPasswordResetResponseDto>>;
  public apiFamilyChildrenIdPasswordResetPost(
    childId: string,
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<ChildPasswordResetResponseDto>('post', `${basePath}/api/Family/children/${encodeURIComponent(childId)}/password-reset`, {
      headers: this.authHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }

  public apiFamilyChildrenIdDelete(
    childId: string,
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<void>;
  public apiFamilyChildrenIdDelete(
    childId: string,
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<void>>;
  public apiFamilyChildrenIdDelete(
    childId: string,
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<void>('delete', `${basePath}/api/Family/children/${encodeURIComponent(childId)}`, {
      headers: this.authHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }

  public apiFamilyChildrenIdReactivatePost(
    childId: string,
    observe?: 'body', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<ChildSummaryDto>;
  public apiFamilyChildrenIdReactivatePost(
    childId: string,
    observe?: 'response', reportProgress?: boolean,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<HttpResponse<ChildSummaryDto>>;
  public apiFamilyChildrenIdReactivatePost(
    childId: string,
    observe: any = 'body', reportProgress: boolean = false,
    options?: { context?: HttpContext; transferCache?: boolean }
  ): Observable<any> {
    const { basePath, withCredentials } = this.configuration;
    return this.httpClient.request<ChildSummaryDto>('post', `${basePath}/api/Family/children/${encodeURIComponent(childId)}/reactivate`, {
      headers: this.authHeaders,
      context: options?.context ?? new HttpContext(),
      responseType: 'json',
      ...(withCredentials ? { withCredentials } : {}),
      observe,
      transferCache: options?.transferCache ?? true,
      reportProgress
    });
  }
}
