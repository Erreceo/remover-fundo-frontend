import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  BackgroundMetadata,
  BatchJobSummary,
  SingleProcessJsonResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class PhotoApiService {
  constructor(private http: HttpClient) {}

  /** Dynamically resolves the API base URL depending on deployment/proxy environment */
  public get baseUrl(): string {
    if (typeof window === 'undefined') {
      return 'http://localhost:8000/api/v1';
    }
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    // Case 1: Running inside code-server or reverse proxy under /proxy/4200/
    if (pathname.includes('/proxy/4200')) {
      return origin + pathname.replace(/\/proxy\/4200.*/, '/proxy/8000/api/v1');
    }
    // Case 2: Running under /proxy/8000/
    if (pathname.includes('/proxy/8000')) {
      return origin + pathname.replace(/\/proxy\/8000.*/, '/proxy/8000/api/v1');
    }

    // Case 3: Running on Angular dev port 4200 directly
    if (window.location.port === '4200') {
      return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
    }

    // Case 4: Running on port 8000 directly (FastAPI serving Angular) or relative
    return `${origin}/api/v1`;
  }

  /** Check API health */
  checkHealth(): Observable<{ status: string; version: string }> {
    return this.http
      .get<{ status: string; version: string }>(`${this.baseUrl}/health`)
      .pipe(catchError(this.handleError));
  }

  /** Get active corporate background metadata */
  getActiveBackground(): Observable<BackgroundMetadata> {
    return this.http
      .get<BackgroundMetadata>(`${this.baseUrl}/background`)
      .pipe(catchError(this.handleError));
  }

  /** Direct URL to view/render active background image */
  getBackgroundImageUrl(): string {
    return `${this.baseUrl}/background/image?t=${Date.now()}`;
  }

  /** Upload and activate a new corporate background image */
  uploadBackground(file: File): Observable<BackgroundMetadata> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<BackgroundMetadata>(`${this.baseUrl}/background`, formData)
      .pipe(catchError(this.handleError));
  }

  /** Remove current active corporate background */
  deleteBackground(): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/background`)
      .pipe(catchError(this.handleError));
  }

  /** Process a single employee photo returning base64 preview */
  processSinglePhoto(file: File): Observable<SingleProcessJsonResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<SingleProcessJsonResponse>(
        `${this.baseUrl}/process/single?format=json`,
        formData
      )
      .pipe(catchError(this.handleError));
  }

  /** Process multiple employee photos in batch */
  processBatch(files: File[]): Observable<BatchJobSummary> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    return this.http
      .post<BatchJobSummary>(`${this.baseUrl}/process/batch`, formData)
      .pipe(catchError(this.handleError));
  }

  /** Full download URL for batch ZIP */
  getBatchDownloadUrl(downloadUrl: string): string {
    if (downloadUrl.startsWith('http')) {
      return downloadUrl;
    }
    const apiRoot = this.baseUrl.replace(/\/api\/v1\/?$/, '');
    const cleanPath = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
    return `${apiRoot}${cleanPath}`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro na comunicação com o backend.';
    if (error.error && error.error.detail) {
      errorMessage = error.error.detail;
    } else if (error.status === 0) {
      errorMessage = 'Não foi possível conectar ao servidor backend (FastAPI). Verifique se o backend está em execução na porta 8000.';
    } else if (error.status === 412) {
      errorMessage = error.error?.detail || 'Nenhuma imagem de fundo configurada. Configure uma imagem de fundo antes de processar fotos.';
    }
    return throwError(() => new Error(errorMessage));
  }
}
