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
  private baseUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

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
    return `http://localhost:8000${downloadUrl}`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro inesperado na comunicação com a API.';
    if (error.error && error.error.detail) {
      errorMessage = error.error.detail;
    } else if (error.status === 0) {
      errorMessage = 'Não foi possível conectar ao servidor backend (FastAPI). Verifique se está em execução na porta 8000.';
    } else if (error.status === 412) {
      errorMessage = error.error?.detail || 'Nenhuma imagem de fundo configurada. Configure uma imagem de fundo antes de processar fotos.';
    }
    return throwError(() => new Error(errorMessage));
  }
}
