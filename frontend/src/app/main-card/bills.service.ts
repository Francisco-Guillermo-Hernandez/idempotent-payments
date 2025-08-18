import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Bill, ErrorResponse } from '../utils/types';
import { Observable, of } from 'rxjs'


@Injectable({
  providedIn: 'root'
})
export class BillsService {

  constructor(private client: HttpClient) { }

  public retrieveDetails(npe: string): Observable<Array<Bill>> {
    return this.client.post<Array<Bill>>(environment.API_GATEWAY_URL.concat('bills/show'), { npe });
  }
}


