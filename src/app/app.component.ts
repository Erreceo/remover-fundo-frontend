import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundConfigComponent } from './components/background-config/background-config.component';
import { SingleProcessComponent } from './components/single-process/single-process.component';
import { BatchProcessComponent } from './components/batch-process/batch-process.component';
import { PhotoApiService } from './services/photo-api.service';

type TabType = 'single' | 'batch' | 'background';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    BackgroundConfigComponent,
    SingleProcessComponent,
    BatchProcessComponent,
  ],
  template: `
    <header class="app-header">
      <div class="header-content">
        <div class="brand">
          <div class="brand-icon">📸</div>
          <div class="brand-title">
            <h1>Remover & Substituir Fundo</h1>
            <p>Fotos Corporativas de Funcionários</p>
          </div>
        </div>

        <nav class="tabs-nav">
          <button
            class="tab-btn"
            [class.active]="activeTab === 'single'"
            (click)="activeTab = 'single'"
          >
            Foto Individual
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'batch'"
            (click)="activeTab = 'batch'"
          >
            Lote de Fotos (.zip)
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'background'"
            (click)="activeTab = 'background'"
          >
            Fundo Padrão
            <span
              *ngIf="hasConfiguredBackground"
              style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--success); margin-left: 4px;"
              title="Fundo Ativo"
            ></span>
          </button>
        </nav>
      </div>
    </header>

    <main class="container">
      <!-- Tab 1: Single Photo Processing -->
      <app-single-process
        *ngIf="activeTab === 'single'"
        (navigateToConfig)="activeTab = 'background'"
      ></app-single-process>

      <!-- Tab 2: Batch Photo Processing -->
      <app-batch-process
        *ngIf="activeTab === 'batch'"
        (navigateToConfig)="activeTab = 'background'"
      ></app-batch-process>

      <!-- Tab 3: Background Configuration -->
      <app-background-config
        *ngIf="activeTab === 'background'"
        (backgroundChanged)="onBackgroundChanged($event)"
      ></app-background-config>
    </main>
  `
})
export class AppComponent implements OnInit {
  activeTab: TabType = 'single';
  hasConfiguredBackground = false;

  constructor(private api: PhotoApiService) {}

  ngOnInit(): void {
    this.api.getActiveBackground().subscribe({
      next: () => {
        this.hasConfiguredBackground = true;
      },
      error: () => {
        this.hasConfiguredBackground = false;
      },
    });
  }

  onBackgroundChanged(hasBg: boolean): void {
    this.hasConfiguredBackground = hasBg;
  }
}
