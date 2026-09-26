import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoApiService } from '../../services/photo-api.service';
import { BackgroundMetadata } from '../../models/api.models';

@Component({
  selector: 'app-background-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="card-title">Configuração da Imagem de Fundo Padrão</h2>
      <p class="card-subtitle">
        Cadastre a imagem corporativa oficial que será aplicada atrás dos colaboradores nos processamentos.
      </p>

      <div *ngIf="errorMessage" class="alert alert-danger">
        <span>{{ errorMessage }}</span>
        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem;" (click)="errorMessage = ''">✕</button>
      </div>

      <div *ngIf="successMessage" class="alert alert-success">
        <span>{{ successMessage }}</span>
        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem;" (click)="successMessage = ''">✕</button>
      </div>

      <!-- Current Background Info -->
      <div *ngIf="activeBackground; else noBackground" class="card" style="background: #f8fafc; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">Fundo Corporativo Ativo</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Arquivo: <strong>{{ activeBackground.filename }}</strong> |
              Dimensões: <strong>{{ activeBackground.width }} x {{ activeBackground.height }}px</strong> |
              Tamanho: <strong>{{ (activeBackground.file_size_bytes / 1024 / 1024).toFixed(2) }} MB</strong>
            </p>
          </div>
          <button class="btn btn-danger" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" (click)="onDeleteBackground()" [disabled]="isLoading">
            Remover Fundo
          </button>
        </div>
        <div style="text-align: center; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem;">
          <img [src]="backgroundImgUrl" alt="Fundo Corporativo Ativo" style="max-height: 280px; max-width: 100%; border-radius: 4px; object-fit: contain;">
        </div>
      </div>

      <ng-template #noBackground>
        <div class="alert alert-warning">
          <span>⚠️ Nenhuma imagem de fundo configurada. Adicione uma imagem corporativa abaixo para liberar o processamento de fotos.</span>
        </div>
      </ng-template>

      <!-- Upload Form -->
      <div style="margin-top: 1.5rem;">
        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">
          {{ activeBackground ? 'Substituir Imagem de Fundo' : 'Enviar Nova Imagem de Fundo' }}
        </h3>
        
        <div
          class="dropzone"
          (click)="fileInput.click()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onFileDrop($event)"
          [class.dragover]="isDragOver"
        >
          <div class="dropzone-icon">🖼️</div>
          <p>Arraste e solte o arquivo de imagem aqui ou <span class="highlight">clique para selecionar</span></p>
          <p style="font-size: 0.75rem; margin-top: 0.4rem;">Formatos aceitos: JPEG, PNG, WEBP (Mínimo 800x600px, máx. 20MB)</p>
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display: none;"
            (change)="onFileSelected($event)"
          >
        </div>

        <div *ngIf="selectedFile" style="margin-top: 1.25rem; display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; padding: 0.75rem 1rem; border-radius: var(--radius-md);">
          <div>
            <span style="font-weight: 600; font-size: 0.9rem;">{{ selectedFile.name }}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
          </div>
          <button class="btn btn-primary" (click)="onUploadBackground()" [disabled]="isLoading">
            <span *ngIf="isLoading" class="spinner"></span>
            {{ isLoading ? 'Salvando...' : 'Salvar e Ativar Fundo' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class BackgroundConfigComponent implements OnInit {
  activeBackground: BackgroundMetadata | null = null;
  backgroundImgUrl: string = '';
  selectedFile: File | null = null;
  isLoading = false;
  isDragOver = false;
  errorMessage = '';
  successMessage = '';

  @Output() backgroundChanged = new EventEmitter<boolean>();

  constructor(private api: PhotoApiService) {}

  ngOnInit(): void {
    this.loadBackground();
  }

  loadBackground(): void {
    this.api.getActiveBackground().subscribe({
      next: (bg) => {
        this.activeBackground = bg;
        this.backgroundImgUrl = this.api.getBackgroundImageUrl();
        this.backgroundChanged.emit(true);
      },
      error: () => {
        this.activeBackground = null;
        this.backgroundChanged.emit(false);
      },
    });
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
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files.length) {
      this.selectedFile = files[0];
    }
  }

  onUploadBackground(): void {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.uploadBackground(this.selectedFile).subscribe({
      next: (meta) => {
        this.isLoading = false;
        this.activeBackground = meta;
        this.backgroundImgUrl = this.api.getBackgroundImageUrl();
        this.selectedFile = null;
        this.successMessage = 'Imagem de fundo corporativa atualizada com sucesso!';
        this.backgroundChanged.emit(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
      },
    });
  }

  onDeleteBackground(): void {
    if (!confirm('Deseja realmente remover o fundo padrão ativo?')) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.deleteBackground().subscribe({
      next: () => {
        this.isLoading = false;
        this.activeBackground = null;
        this.successMessage = 'Fundo corporativo removido.';
        this.backgroundChanged.emit(false);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
      },
    });
  }
}
