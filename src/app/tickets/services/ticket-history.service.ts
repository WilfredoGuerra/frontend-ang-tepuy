import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TicketHistoryResponse, TicketHistorySearchCriteria } from '../interfaces/ticket.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketHistoryService {
  private baseUrl = `${environment.baseUrl}/tickets`;

  constructor(private http: HttpClient) { }

  getTicketHistory(ticketId: number): Observable<TicketHistoryResponse> {
    return this.http.get<TicketHistoryResponse>(`${this.baseUrl}/${ticketId}/history`);
  }

  getAllTicketHistory(params?: TicketHistorySearchCriteria): Observable<TicketHistoryResponse> {
  let url = `${this.baseUrl}/history/all`;

  if (params) {
    const queryParams = new URLSearchParams();
    if (params.ticketNumber) queryParams.append('ticketNumber', params.ticketNumber);
    if (params.updatedBy) queryParams.append('updatedBy', params.updatedBy);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.action) queryParams.append('action', params.action);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    url += `?${queryParams.toString()}`;
  }

  return this.http.get<TicketHistoryResponse>(url);
}
}
