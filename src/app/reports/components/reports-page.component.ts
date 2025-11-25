import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportsService, ReportFilter } from '../services/reports.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reports-page.component.html'
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  filterOptions: any;
  filterForm: FormGroup;
  isLoading = false;
  showFilters = true;
  showPdf = false;
  pdfUrl: SafeResourceUrl | null = null;
  pdfBlob: Blob | null = null; // Guardamos el blob original
  currentFilters: ReportFilter = {};

  limitOptions = [50, 100, 200, 500, 1000];

  constructor() {
    this.filterOptions = this.reportsService.getFilterOptions();

    this.filterForm = this.fb.group({
      createdDateStart: [''],
      createdDateEnd: [''],
      groupIds: this.fb.array([]),
      severityId: [''],
      platformId: [''],
      statusId: [''],
      failureId: [''],
      definition_problem: [''],
      limit: [100]
    });

    this.initializeGroupCheckboxes();
  }

  ngOnInit() {}

  ngOnDestroy() {
    // Limpiar recursos cuando se destruye el componente
    this.cleanupPdfResources();
  }

  private initializeGroupCheckboxes(): void {
    const groupArray = this.filterForm.get('groupIds') as FormArray;
    this.filterOptions.groups.forEach(() => {
      groupArray.push(new FormControl(false));
    });
  }

  get groupIdsArray(): FormArray {
    return this.filterForm.get('groupIds') as FormArray;
  }

  getSelectedGroupIds(): number[] {
    return this.groupIdsArray.controls
      .map((control, index) => control.value ? this.filterOptions.groups[index].id : null)
      .filter(id => id !== null) as number[];
  }

  generateReport(): void {
    if (this.filterForm.invalid) return;

    this.isLoading = true;

    const formValue = this.filterForm.value;
    const filters: ReportFilter = {
      createdDateStart: formValue.createdDateStart,
      createdDateEnd: formValue.createdDateEnd,
      severityId: formValue.severityId,
      platformId: formValue.platformId,
      statusId: formValue.statusId,
      failureId: formValue.failureId,
      definition_problem: formValue.definition_problem,
      limit: formValue.limit
    };

    const selectedGroupIds = this.getSelectedGroupIds();
    if (selectedGroupIds.length > 0) {
      filters.groupId = selectedGroupIds;
    }

    this.currentFilters = filters;

    this.reportsService.generatePdfReport(filters).subscribe({
      next: (blob: Blob) => {
        this.cleanupPdfResources();
        this.pdfBlob = blob;
        const url = this.reportsService.createPdfUrl(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isLoading = false;
        this.showFilters = false;
        this.showPdf = true;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.isLoading = false;
        alert('Error al generar el reporte. Por favor, intenta nuevamente.');
      }
    });
  }

  private cleanupPdfResources(): void {
    // Limpiar URL del blob
    if (this.pdfUrl) {
      try {
        const unsafeUrl = this.extractUnsafeUrl(this.pdfUrl);
        if (unsafeUrl && unsafeUrl.startsWith('blob:')) {
          this.reportsService.revokePdfUrl(unsafeUrl);
        }
      } catch (error) {
        console.warn('Error al limpiar URL del PDF:', error);
      }
      this.pdfUrl = null;
    }

    // Limpiar blob
    this.pdfBlob = null;
  }

  private extractUnsafeUrl(safeUrl: SafeResourceUrl): string | null {
    try {
      return safeUrl.toString();
    } catch (error) {
      console.warn('No se pudo extraer la URL del SafeResourceUrl:', error);
      return null;
    }
  }

  downloadPdf(): void {
    if (this.pdfBlob) {
      // Usar el blob guardado para descargar
      this.reportsService.downloadPdf(this.pdfBlob, this.currentFilters);
    } else {
      // Si no hay blob, regenerar el reporte
      this.regenerateForDownload();
    }
  }

  private regenerateForDownload(): void {
    this.reportsService.generatePdfReport(this.currentFilters).subscribe({
      next: (blob: Blob) => {
        this.reportsService.downloadPdf(blob, this.currentFilters);
      },
      error: (error) => {
        console.error('Error regenerando PDF para descarga:', error);
        alert('Error al descargar el PDF. Por favor, intenta generar el reporte nuevamente.');
      }
    });
  }

  closePdf(): void {
    // Limpiar recursos
    this.cleanupPdfResources();

    this.showPdf = false;
    this.showFilters = true;
  }

  clearFilters(): void {
    this.filterForm.reset({
      groupIds: this.groupIdsArray.controls.map(() => false),
      limit: 100
    });
  }

  selectAllGroups(): void {
    this.groupIdsArray.controls.forEach(control => {
      control.setValue(true);
    });
  }

  clearAllGroups(): void {
    this.groupIdsArray.controls.forEach(control => {
      control.setValue(false);
    });
  }
}
