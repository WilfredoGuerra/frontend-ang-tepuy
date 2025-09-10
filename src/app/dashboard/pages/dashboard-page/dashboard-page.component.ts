// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard-page.component.html',
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export default class DashboardComponent implements OnInit, OnDestroy {

  authService = inject(AuthService);

  filterForm: FormGroup;
  isLoading = true;
  filtersOpen = false;

  // Datos para gráficos y estadísticas
  stats: any = {};
  ticketsByGroup: any = {};
  ticketsByPlatform: any = {};
  ticketsBySeverity: any = {};
  ticketsByStatus: any = {};
  ticketsByOrigin: any = {};
  ticketsByFailure: any = {};
  ticketsByUser: any = {};
  recentTickets: any[] = [];
  filterOptions: any = {};

  // Objeto para almacenar instancias de gráficos
  charts: { [key: string]: Chart } = {};

  // Colores para los gráficos
  private severityColors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)'
  ];

  private statusColors = [
    'rgba(255, 159, 64, 0.8)',
    'rgba(201, 203, 207, 0.8)',
    'rgba(0, 162, 235, 0.8)',
    'rgba(153, 102, 0, 0.8)',
    'rgba(255, 128, 0, 0.8)'
  ];

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      groupId: [''],
      platformId: [''],
      severityId: [''],
      statusId: [''],
      originId: [''],
      failureId: [''],
      userId: ['']
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadDashboardData();

    // Escuchar cambios en los filtros con debounce
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  loadFilterOptions(): void {
    this.dashboardService.getFilterOptions().subscribe({
      next: (options) => {
        this.filterOptions = options;
      },
      error: (error) => {
        console.error('Error loading filter options', error);
      }
    });
  }

  loadDashboardData(): void {
    this.isLoading = true;

    this.dashboardService.getDashboardData(this.filterForm.value).subscribe({
      next: (data: any) => {
        this.stats = data.stats;
        this.ticketsByGroup = data.ticketsByGroup;
        this.ticketsByPlatform = data.ticketsByPlatform;
        this.ticketsBySeverity = data.ticketsBySeverity;
        this.ticketsByStatus = data.ticketsByStatus;
        this.ticketsByOrigin = data.ticketsByOrigin;
        this.ticketsByFailure = data.ticketsByFailure;
        this.ticketsByUser = data.ticketsByUser;
        this.recentTickets = data.recentTickets;

        this.createCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadDashboardData();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.loadDashboardData();
  }

  createCharts(): void {
    this.createBarChart('groupChart', 'Tickets por Grupo', this.ticketsByGroup);
    this.createBarChart('platformChart', 'Tickets por Plataforma', this.ticketsByPlatform);
    this.createDoughnutChart('severityChart', 'Tickets por Severidad', this.ticketsBySeverity);
    this.createPieChart('statusChart', 'Tickets por Estado', this.ticketsByStatus);
    this.createBarChart('originChart', 'Tickets por Origen', this.ticketsByOrigin);
    this.createBarChart('failureChart', 'Tickets por Tipo de Falla', this.ticketsByFailure);
    this.createBarChart('userChart', 'Tickets por Usuario', this.ticketsByUser);
  }

  createBarChart(canvasId: string, title: string, data: { [key: string]: number }): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Destruir gráfico existente si existe
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    const chartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [{
        label: 'Cantidad',
        data: values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(201, 203, 207, 0.7)',
          'rgba(0, 162, 235, 0.7)',
          'rgba(153, 102, 0, 0.7)',
          'rgba(255, 128, 0, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(201, 203, 207, 1)',
          'rgba(0, 162, 235, 1)',
          'rgba(153, 102, 0, 1)',
          'rgba(255, 128, 0, 1)'
        ],
        borderWidth: 1
      }]
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: options
    });
  }

  createPieChart(canvasId: string, title: string, data: { [key: string]: number }): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Destruir gráfico existente si existe
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    const chartData: ChartData<'pie'> = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: this.statusColors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    };

    const options: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      layout: {
        padding: 20
      }
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'pie',
      data: chartData,
      options: options
    });
  }

  createDoughnutChart(canvasId: string, title: string, data: { [key: string]: number }): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Destruir gráfico existente si existe
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    const chartData: ChartData<'doughnut'> = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: this.severityColors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    };

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      layout: {
        padding: 20
      }
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: chartData,
      options: options
    });
  }

  getSeverityKeys(): string[] {
    return Object.keys(this.ticketsBySeverity);
  }

  getStatusKeys(): string[] {
    return Object.keys(this.ticketsByStatus);
  }

  getSeverityColor(key: string): string {
    const index = this.getSeverityKeys().indexOf(key);
    return index >= 0 ? this.severityColors[index % this.severityColors.length] : '#ccc';
  }

  getStatusColor(key: string): string {
    const index = this.getStatusKeys().indexOf(key);
    return index >= 0 ? this.statusColors[index % this.statusColors.length] : '#ccc';
  }

  // Limpiar gráficos al destruir el componente
  ngOnDestroy(): void {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }
}
