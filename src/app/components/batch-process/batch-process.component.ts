import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoApiService } from '../../services/photo-api.service';
import { BatchJobSummary } from '../../models/api.models';

@Component({
  selector: 'app-batch-process',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="card-title">Processamento em Lote de Fotos</h2>
      <p class="card-subtitle">
        Envie até 50 fotos de funcionários simultaneamente. O sistema processará cada imagem com o fundo corporativo e disponibilizará um arquivo ZIP com todas as fotos tratadas.
      </p>

      <div *ngIf="errorMessage" class="alert alert-danger">
        <div>
          <span>{{ errorMessage }}</span>
          <div *ngIf="isPreconditionFailed" style="margin-top: 0.5rem;">
            <button class="btn btn-secondary" style="font-size: 0.8rem;" (click)="navigateToConfig.emit()">
              Ir para Configurações de Fundo ➔
            </button>
          </div>
        </div>
        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem;" (click)="errorMessage = ''">✕</button>
      </div>

      <!-- Multiple Dropzone -->
      <div
        class="dropzone"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onFileDrop($event)"
        [class.dragover]="isDragOver"
      >
        <div class="dropzone-icon">📁</div>
        <p>Arraste e solte múltiplas fotos de colaboradores ou <span class="highlight">clique para selecionar</span></p>
        <p style="font-size: 0.75rem; margin-top: 0.4rem;">Formatos aceitos: JPEG, PNG, WEBP (Limite de 50 fotos por lote, até 15MB cada)</p>
        <input
          #fileInput
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          style="display: none;"
          (change)="onFilesSelected($event)"
        >
      </div>

      <!-- Selected Files Summary & Action -->
      <div *ngIf="selectedFiles.length > 0" style="margin-top: 1.25rem; display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; padding: 0.75rem 1rem; border-radius: var(--radius-md);">
        <div>
          <span style="font-weight: 600; font-size: 0.9rem;">{{ selectedFiles.length }} fotos selecionadas</span>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">
            ({{ (totalSelectedBytes / 1024 / 1024).toFixed(2) }} MB total)
          </span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" (click)="selectedFiles = []; batchSummary = null;" [disabled]="isLoading">
            Limpar
          </button>
          <button class="btn btn-primary" (click)="onProcessBatch()" [disabled]="isLoading || selectedFiles.length > 50">
            <span *ngIf="isLoading" class="spinner"></span>
            {{ isLoading ? 'Processando Lote com IA...' : 'Processar Lote de Fotos' }}
          </button>
        </div>
      </div>

      <!-- Loading State & Progress Indicator -->
      <div *ngIf="isLoading" style="margin-top: 1.5rem; text-align: center;">
        <p style="font-size: 0.9rem; color: var(--text-muted);">
          Isolando colaboradores e compondo com o fundo corporativo... Isso pode levar alguns segundos.
        </p>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: 100%; animation: pulse 1.5s infinite;"></div>
        </div>
      </div>

      <!-- Batch Result Summary & Download -->
      <div *ngIf="batchSummary" style="margin-top: 2rem;">
        <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: #166534;">Lote Concluído com Sucesso!</h3>
              <p style="font-size: 0.875rem; color: #15803d;">
                Total: <strong>{{ batchSummary.total_photos }}</strong> |
                Processadas: <strong>{{ batchSummary.processed_count }}</strong> |
                Falhas: <strong>{{ batchSummary.failed_count }}</strong>
              </p>
            </div>
            <a
              *ngIf="batchSummary.processed_count > 0"
              [href]="getDownloadUrl(batchSummary.download_url)"
              class="btn btn-primary"
              style="background: #16a34a;"
              download
            >
              📦 Baixar Todas as Fotos (.zip)
            </a>
          </div>
        </div>

        <!-- Items Table -->
        <h4 style="font-size: 0.95rem; font-weight: 700; margin: 1.25rem 0 0.5rem;">Detalhamento do Lote</h4>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Arquivo Original</th>
                <th>Status</th>
                <th>Tempo</th>
                <th>Arquivo de Saída / Detalhe</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of batchSummary.items; let i = index">
                <td>{{ i + 1 }}</td>
                <td style="font-weight: 500;">{{ item.original_filename }}</td>
                <td>
                  <span class="badge" [ngClass]="item.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'">
                    {{ item.status === 'SUCCESS' ? 'Processada' : 'Falha' }}
                  </span>
                </td>
                <td>{{ item.processing_time_ms }}ms</td>
                <td>
                  <span *ngIf="item.status === 'SUCCESS'" style="color: var(--success); font-family: monospace;">
                    {{ item.output_filename }}
                  </span>
                  <span *ngIf="item.status === 'FAILED'" style="color: var(--danger);">
                    {{ item.error_message }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class BatchProcessComponent {
  selectedFiles: File[] = [];
  batchSummary: BatchJobSummary | null = null;
  isLoading = false;
  isDragOver = false;
  errorMessage = '';
  isPreconditionFailed = false;

  @Output() navigateToConfig = new EventEmitter<void>();

  constructor(private api: PhotoApiService) {}

  get totalSelectedBytes(): number {
    return this.selectedFiles.reduce((acc, f) => acc + f.size, 0);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files.length) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFilesSelected(event: any): void {
    const files = event.target.files;
    if (files.length) {
      this.addFiles(Array.from(files));
    }
  }

  private addFiles(files: File[]): void {
    this.selectedFiles = files;
    this.batchSummary = null;
    this.errorMessage = '';
    this.isPreconditionFailed = false;

    if (this.selectedFiles.length > 50) {
      this.errorMessage = 'Atenção: O lote excede o limite máximo recomendado de 50 fotos.';
    }
  }

  onProcessBatch(): void {
    if (!this.selectedFiles.length) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.isPreconditionFailed = false;
    this.batchSummary = null;

    this.api.processBatch(this.selectedFiles).subscribe({
      next: (summary) => {
        this.isLoading = false;
        this.batchSummary = summary;
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        if (err.message.includes('fundo configurada')) {
          this.isPreconditionFailed = true;
        }
      },
    });
  }

  getDownloadUrl(url: string): string {
    return this.api.getBatchDownloadUrl(url);
  }
}
