
import {catchError, map} from 'rxjs/operators';
/* tslint:disable:no-unused-variable member-ordering */
import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers, Response, Request, RequestMethod, URLSearchParams } from '@angular/http';
import * as Rx from 'rxjs';
import { Error } from './Error';
import { HttpHelper } from './HttpHelper';
import { IApi } from './IApi';

@Injectable()
export abstract class BaseApi<T> implements IApi<T> {
  public keyName = 'id';
  public resourceName = 'resource';
  public defaultHeaders: Headers = new Headers({});

  protected basePath = 'http://localhost:2000/odata';

  constructor(protected http: Http) {
    this.defaultHeaders.append('Access-Control-Allow-Origin', '*');
  }

  /**
   * Get EntitySet Addresses
   * Returns the EntitySet Addresses
   * @param expand Expand navigation property
   * @param filter filter property
   * @param select select structural property
   * @param orderBy order by some property
   * @param top top elements
   * @param skip skip elements
   * @param count include count in response
   */
  public get(expand?: string, filter?: string, select?: string, orderBy?: string, top?: number, skip?: number, count?: boolean,
    keywords?: string,
    extraHttpRequestParams?: any): Rx.Observable<{ count: number, list: T[] }> {
    const oData = HttpHelper.createOData(select, orderBy, expand, filter, top, skip, count);
    const urlSearchParams = HttpHelper.createUrlSearchParamsFromOData(oData);

    const path = `${this.basePath}/${this.resourceName}`;

    const headerParams: any = this.extendObj({}, this.defaultHeaders);

    const options = new RequestOptions({
      method: RequestMethod.Get,
      url: path,
      headers: headerParams,
      search: urlSearchParams
    });

    const req = new Request(options);

    return this.http.request(req).pipe(
      map(
        (res: Response) => {
          const listWithCount = {
            count: res.json()['@odata.count'],
            list: res.json().value
          };
          this.changeDateStringToDateObject(listWithCount.list);
          return listWithCount;
        }),catchError(this.handleError),);
  }

  public post(item?: T): Rx.Observable<any> {
    const path = `${this.basePath}/${this.resourceName}`;

    const headerParams: any = this.extendObj({}, this.defaultHeaders);

    const options = new RequestOptions({
      method: RequestMethod.Post,
      url: path,
      headers: headerParams,
      body: JSON.stringify(item)
    });

    const req = new Request(options);

    return this.http.request(req);
  }

  public getById(id: number, select?: string): Rx.Observable<any> {
    const path = `${this.basePath}/${this.resourceName}(${id})`;

    const headerParams: any = this.extendObj({}, this.defaultHeaders);

    if (!id) {
      throw new Error(`Missing required parameter "${this.keyName}" when calling getById.`);
    }

    const oData = HttpHelper.createOData(select, null, null, null, null, null, null);
    const urlSearchParams = HttpHelper.createUrlSearchParamsFromOData(oData);

    const options = new RequestOptions({
      method: RequestMethod.Get,
      url: path,
      search: urlSearchParams,
      headers: headerParams
    });

    const req = new Request(options);

    return this.http.request(req);
  }

  public getNewId() {
    return 0;
  }

  public delete(id: number, ifMatch?: string): Rx.Observable<{}> {
    const path = `${this.basePath}/${this.resourceName}(${id})`;

    const headerParams: any = this.extendObj({}, this.defaultHeaders);

    if (!id) {
      throw new Error('Missing required parameter "id" when calling delete.');
    }

    headerParams['If-Match'] = ifMatch;

    const options = new RequestOptions({
      method: RequestMethod.Delete,
      url: path,
      headers: headerParams
    });

    const req = new Request(options);

    return this.http.request(req);
  }

  public patch(id: number, item?: T, extraHttpRequestParams?: any): Rx.Observable<any> {
    const path = `${this.basePath}/${this.resourceName}(${id})`;

    const headerParams: any = this.extendObj({}, this.defaultHeaders);

    if (!id) {
      throw new Error(`Missing required parameter "${this.keyName}" when calling patch`);
    }

    const options = new RequestOptions({
      method: RequestMethod.Patch,
      url: path,
      headers: headerParams,
      body: JSON.stringify(item)
    });

    const req = new Request(options);

    return this.http.request(req);
  }

  public save(item?: T, isEdited: boolean = true, extraHttpRequestParams?: any): Rx.Observable<T> {
    console.log('BaseApi Save');
    if (item[this.keyName] !== null) {
      return this.patch(item[this.keyName], item);
    } else {
      return this.post(item);
    }
  }

  protected changeDateStringToDateObject(list) {
    list.forEach(item => {
      item.ModifiedDate = new Date(item.ModifiedDate);
    });
  }

  protected extendObj<T1, T2>(objA: T1, objB: T2): T1 & T2 {
    for (const key in objB) {
      if (objB.hasOwnProperty(key)) {
        (<T1 & T2>objA)[key] = (<T1 & T2>objB)[key];
      }
    }
    return <T1 & T2>objA;
  }

  protected handleError(error: Response) {
    console.error(error);
    return Rx.Observable.throw(error.json().error || 'Server error');
  }
}

/* NinjaCodeGen.com by DNAfor.NET */
