import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoApiService } from '../../services/photo-api.service';
import { SingleProcessJsonResponse } from '../../models/api.models';

@Component({
  selector: 'app-single-process',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="card-title">Processamento Individual de Foto</h2>
      <p class="card-subtitle">
        Envie a foto de um colaborador para remover o fundo atual e substituí-lo automaticamente pelo fundo corporativo configurado.
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

      <!-- File Dropzone -->
      <div
        class="dropzone"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onFileDrop($event)"
        [class.dragover]="isDragOver"
      >
        <div class="dropzone-icon">👤</div>
        <p>Arraste e solte o retrato do funcionário ou <span class="highlight">clique para selecionar</span></p>
        <p style="font-size: 0.75rem; margin-top: 0.4rem;">Formatos aceitos: JPEG, PNG, WEBP (máx. 15MB)</p>
        <input
          #fileInput
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display: none;"
          (change)="onFileSelected($event)"
        >
      </div>

      <!-- Selected File Actions -->
      <div *ngIf="selectedFile" style="margin-top: 1.25rem; display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; padding: 0.75rem 1rem; border-radius: var(--radius-md);">
        <div>
          <span style="font-weight: 600; font-size: 0.9rem;">{{ selectedFile.name }}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">
            ({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)
          </span>
        </div>
        <button class="btn btn-primary" (click)="onProcessPhoto()" [disabled]="isLoading">
          <span *ngIf="isLoading" class="spinner"></span>
          {{ isLoading ? 'Processando Imagem com IA...' : 'Processar e Substituir Fundo' }}
        </button>
      </div>

      <!-- Comparison Preview Grid -->
      <div *ngIf="originalPreviewUrl || processedResult" class="preview-grid">
        <!-- Original Photo -->
        <div *ngIf="originalPreviewUrl" class="preview-box">
          <h4>Foto Original</h4>
          <img [src]="originalPreviewUrl" alt="Foto Original">
        </div>

        <!-- Processed Result -->
        <div *ngIf="processedResult" class="preview-box" style="border-color: var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="color: var(--primary); margin-bottom: 0;">Resultado Processado</h4>
            <span class="badge badge-success">Concluído em {{ processedResult.processing_time_ms }}ms</span>
          </div>
          <img [src]="processedResult.image_base64" alt="Foto Processada com Novo Fundo">
          <div style="margin-top: 1rem;">
            <a
              [href]="processedResult.image_base64"
              [download]="processedResult.output_filename"
              class="btn btn-primary"
              style="width: 100%;"
            >
              ⬇️ Baixar Foto Tratada (.png)
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SingleProcessComponent {
  selectedFile: File | null = null;
  originalPreviewUrl: string | null = null;
  processedResult: SingleProcessJsonResponse | null = null;
  isLoading = false;
  isDragOver = false;
  errorMessage = '';
  isPreconditionFailed = false;

  @Output() navigateToConfig = new EventEmitter<void>();

  constructor(private api: PhotoApiService) {}

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
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files.length) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.selectedFile = file;
    this.processedResult = null;
    this.errorMessage = '';
    this.isPreconditionFailed = false;

    // Create local preview URL
    const reader = new FileReader();
    reader.onload = () => {
      this.originalPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onProcessPhoto(): void {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.isPreconditionFailed = false;

    this.api.processSinglePhoto(this.selectedFile).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.processedResult = res;
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
}
