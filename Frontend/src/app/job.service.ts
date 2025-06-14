import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private apiUrl: string = 'http://localhost:5000/api/jobs'; // Replace with your backend API base URL

  constructor(private http: HttpClient) {}

  getJobs(token: any): Observable<{ jobs: any[] }> {
    //used in manager dashboard

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    console.log('in job service');

    return this.http.get<{ jobs: any[] }>(this.apiUrl, { headers });
  }

  createJob(job: any, token: any): Observable<any> {
    //used in manager dash

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<any>(this.apiUrl, job, { headers }); // Send POST request to create a job
  }

  updateJob(id: string, job: any, token: any): Observable<any> {
    //used in md

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.put<any>(`${this.apiUrl}/${id}`, job, { headers });
  }

  deleteJob(id: string, token: any): Observable<any> {
    //used in md

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }

  applyJob(jobId: any, token: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<any>(
      `${this.apiUrl}/${jobId}/apply`,
      {},
      { headers }
    );
  }

  viewJobApplicants(jobId: any, token: any): Observable<any> {
    //used in md

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any>(`${this.apiUrl}/${jobId}/applicants`, {
      headers,
    });
  }

  viewEmployeeApplications(token: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any>(`${this.apiUrl}/applications`, { headers });
  }

  // withdrawApplication(jobId: string, token: string) {

  //   return this.http.delete(`${this.apiUrl}/${jobId}/withdraw`, {

  //     headers: { Authorization: `Bearer ${token}` }

  //   });

  // }

  withdrawApplication(applicationId: string, token: string) {
    return this.http.delete(
      `${this.apiUrl}/applications/${applicationId}/withdraw`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  getAppliedJobs(token: string) {
    return this.http.get<{ appliedJobs: any[] }>(
      `${this.apiUrl}/applications/status`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  getApplicants(jobId: string): Observable<any> {
    //used in md

    return this.http.get<any>(`${this.apiUrl}/jobs/${jobId}/applicants`);
  }
}
