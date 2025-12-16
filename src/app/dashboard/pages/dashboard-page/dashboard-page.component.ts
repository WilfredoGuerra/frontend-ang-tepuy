// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule, SlicePipe } from '@angular/common';
import { AuthService } from '@auth/services/auth.service';

interface FiberCutState {
  state: string;
  count: number;
}

Chart.register(...registerables);

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard-page.component.html',
  imports: [CommonModule, ReactiveFormsModule, SlicePipe],
})
export default class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);

  fiberCutStates: FiberCutState[] = [];
  totalFiberCuts: number = 0;
  showTopFailures: boolean = true;
  isLoading = true;

  // Datos para gráficos y estadísticas
  stats: any = {
    totalTickets: 0,
    resolvedTickets: 0,
    openPercentage: 0,
    resolvedPercentage: 0,
    canceledPercentage: 0,
  };

  ticketsByGroup: { [key: string]: number } = {};
  ticketsByPlatform: { [key: string]: number } = {};
  ticketsBySeverity: { [key: string]: number } = {};
  ticketsByStatus: { [key: string]: number } = {};
  ticketsByOrigin: { [key: string]: number } = {};
  ticketsByFailure: { [key: string]: number } = {};
  fiberCutByState: { [key: string]: number } = {};

  charts: { [key: string]: Chart } = {};

  private chartColors = {
    primary: [
      'rgba(102, 126, 234, 0.8)', // Azul principal
      'rgba(118, 75, 162, 0.8)', // Púrpura
      'rgba(234, 102, 102, 0.8)', // Rojo
      'rgba(102, 234, 138, 0.8)', // Verde
      'rgba(234, 202, 102, 0.8)', // Amarillo
      'rgba(102, 217, 234, 0.8)', // Cyan
      'rgba(234, 153, 102, 0.8)', // Naranja
      'rgba(162, 102, 234, 0.8)', // Violeta
      'rgba(102, 234, 195, 0.8)', // Verde agua
      'rgba(234, 102, 178, 0.8)', // Rosa
    ],
    borders: [
      'rgba(102, 126, 234, 1)',
      'rgba(118, 75, 162, 1)',
      'rgba(234, 102, 102, 1)',
      'rgba(102, 234, 138, 1)',
      'rgba(234, 202, 102, 1)',
      'rgba(102, 217, 234, 1)',
      'rgba(234, 153, 102, 1)',
      'rgba(162, 102, 234, 1)',
      'rgba(102, 234, 195, 1)',
      'rgba(234, 102, 178, 1)',
    ],
  };

  // Colores para severidad (rojo, naranja, amarillo, azul, gris)
  private severityColors = [
    'rgba(239, 68, 68, 0.9)', // Rojo - Alta
    'rgba(249, 115, 22, 0.9)', // Naranja - Media
    'rgba(234, 179, 8, 0.9)', // Amarillo - Baja
    'rgba(59, 130, 246, 0.9)', // Azul - Informativa
    'rgba(156, 163, 175, 0.9)', // Gris - Sin severidad
  ];

  // Colores para estados
  private statusColors = [
    'rgba(34, 197, 94, 0.9)', // Verde - Resuelto
    'rgba(59, 130, 246, 0.9)', // Azul - En proceso
    'rgba(239, 68, 68, 0.9)', // Rojo - Cancelado
    'rgba(249, 115, 22, 0.9)', // Naranja - Pendiente
    'rgba(156, 163, 175, 0.9)', // Gris - Otros
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadFiberCutData();
    this.showTopFailures = true;
  }

  // Métodos auxiliares para el template
  getKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getTotalValue(obj: any): number {
    if (!obj) return 0;
    return Object.values(obj).reduce(
      (sum: number, val: any) => sum + (Number(val) || 0),
      0
    );
  }

  getPercentage(value: number, total: number): string {
    if (!total || total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  }

  getChartColorForGroup(group: string): string {
    const groups = this.getKeys(this.ticketsByGroup);
    const index = groups.indexOf(group);
    return this.chartColors.primary[index % this.chartColors.primary.length];
  }

  getChartColorForPlatform(platform: string): string {
    const platforms = this.getKeys(this.ticketsByPlatform);
    const index = platforms.indexOf(platform);
    return this.chartColors.primary[index % this.chartColors.primary.length];
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (data: any) => {
        this.stats = data.stats;
        this.ticketsByGroup = data.ticketsByGroup || {};
        this.ticketsByPlatform = data.ticketsByPlatform || {};
        this.ticketsBySeverity = data.ticketsBySeverity || {};
        this.ticketsByStatus = data.ticketsByStatus || {};
        this.ticketsByOrigin = data.ticketsByOrigin || {};
        this.ticketsByFailure = data.ticketsByFailure || {};

        // Calcular porcentajes si no vienen del backend
        const totalTickets =
          this.stats.totalTickets || this.getTotalValue(this.ticketsByStatus);
        if (totalTickets > 0) {
          this.stats.openPercentage = this.getPercentage(
            this.ticketsByStatus['en proceso'] || 0,
            totalTickets
          );
          this.stats.resolvedPercentage = this.getPercentage(
            this.stats.resolvedTickets || 0,
            totalTickets
          );
          this.stats.canceledPercentage = this.getPercentage(
            this.ticketsByStatus['cancelado'] || 0,
            totalTickets
          );
        }

        this.createCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.isLoading = false;
      },
    });
  }

  loadFiberCutData(): void {
    this.dashboardService.getFiberCutByState().subscribe({
      next: (data: any) => {
        this.fiberCutByState =
          data.topStates?.reduce((acc: any, item: any) => {
            acc[item.state] = item.fiberCutsCount;
            return acc;
          }, {}) || {};

        this.calculateFiberCutProperties();
        this.createFiberCutChart();
      },
      error: (error) => {
        console.error('Error loading fiber cut data', error);
        this.fiberCutByState = {};
        this.fiberCutStates = [];
        this.totalFiberCuts = 0;
      },
    });
  }

  private calculateFiberCutProperties(): void {
    if (!this.fiberCutByState || typeof this.fiberCutByState !== 'object') {
      this.fiberCutStates = [];
      this.totalFiberCuts = 0;
      return;
    }

    try {
      const entries = Object.entries(this.fiberCutByState);

      this.fiberCutStates = entries
        .map(([state, count]) => ({
          state: state,
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count);

      this.totalFiberCuts = this.fiberCutStates.reduce(
        (total, state) => total + state.count,
        0
      );
    } catch (error) {
      console.error('Error calculando propiedades de cortes de fibra:', error);
      this.fiberCutStates = [];
      this.totalFiberCuts = 0;
    }
  }

  createCharts(): void {
    this.createBarChart('groupChart', 'Tickets por Grupo', this.ticketsByGroup);
    this.createBarChart(
      'platformChart',
      'Tickets por Plataforma',
      this.ticketsByPlatform
    );
    this.createDoughnutChart(
      'severityChart',
      'Tickets por Severidad',
      this.ticketsBySeverity,
      this.severityColors
    );
    this.createPieChart(
      'statusChart',
      'Tickets por Estado',
      this.ticketsByStatus,
      this.statusColors
    );
    this.createHorizontalBarChart(
      'originChart',
      'Tickets por Origen',
      this.ticketsByOrigin
    );
    this.createHorizontalBarChart(
      'failureChart',
      'Tickets por Tipo de Falla',
      this.ticketsByFailure
    );
  }

  createFiberCutChart(): void {
    this.createDoughnutChart(
      'fiberCutChart',
      'Cortes de Fibra por Estado',
      this.fiberCutByState
    );
  }

  createBarChart(
    canvasId: string,
    title: string,
    data: { [key: string]: number }
  ): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = this.getKeys(data);
    const values = labels.map((label) => data[label] || 0);

    if (labels.length === 0) {
      this.createEmptyChart(canvasId, title);
      return;
    }

    const chartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [
        {
          label: 'Cantidad',
          data: values,
          backgroundColor: labels.map(
            (_, i) =>
              this.chartColors.primary[i % this.chartColors.primary.length]
          ),
          borderColor: labels.map(
            (_, i) =>
              this.chartColors.borders[i % this.chartColors.borders.length]
          ),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' },
          color: '#374151',
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed.y;
              const total = values.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: Math.ceil(Math.max(...values) / 5) || 1,
            precision: 0,
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: options,
    });
  }

  createHorizontalBarChart(
    canvasId: string,
    title: string,
    data: { [key: string]: number }
  ): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const displayData =
      canvasId === 'failureChart' ? this.getTopEntries(data, 5) : data;

    const labels = this.getKeys(displayData);
    const values = labels.map((label) => displayData[label] || 0);

    if (labels.length === 0) {
      this.createEmptyChart(canvasId, title);
      return;
    }

    const chartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [
        {
          label: 'Cantidad',
          data: values,
          backgroundColor: labels.map(
            (_, i) =>
              this.chartColors.primary[i % this.chartColors.primary.length]
          ),
          borderColor: labels.map(
            (_, i) =>
              this.chartColors.borders[i % this.chartColors.borders.length]
          ),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' },
          color: '#374151',
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed.x;
              const total = values.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: Math.ceil(Math.max(...values) / 5) || 1,
            precision: 0,
          },
        },
      },
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: options,
    });
  }

  createPieChart(
    canvasId: string,
    title: string,
    data: { [key: string]: number },
    colors?: string[]
  ): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = this.getKeys(data);
    const values = labels.map((label) => data[label] || 0);

    if (labels.length === 0) {
      this.createEmptyChart(canvasId, title);
      return;
    }

    const chartData: ChartData<'pie'> = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor:
            colors ||
            labels.map(
              (_, i) =>
                this.chartColors.primary[i % this.chartColors.primary.length]
            ),
          borderColor: '#fff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };

    const options: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total =
                context.dataset.data?.reduce(
                  (a: number, b: number) => a + b,
                  0
                ) || 1;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      layout: { padding: 20 },
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'pie',
      data: chartData,
      options: options,
    });
  }

  createDoughnutChart(
    canvasId: string,
    title: string,
    data: { [key: string]: number },
    colors?: string[]
  ): void {
    try {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;

      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      const labels = this.getKeys(data);
      const values = labels.map((label) => data[label] || 0);

      if (labels.length === 0) {
        this.createEmptyChart(canvasId, title);
        return;
      }

      const backgroundColors =
        colors || labels.map((_, index) => this.getChartColor(index));

      const chartData: ChartData<'doughnut'> = {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: backgroundColors,
            borderColor: '#fff',
            borderWidth: 2,
            hoverBorderWidth: 3,
          },
        ],
      };

      const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total =
                  context.dataset.data?.reduce(
                    (a: number, b: number) => a + b,
                    0
                  ) || 1;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        cutout: '55%',
        layout: {
          padding: 10,
        },
      };

      this.charts[canvasId] = new Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: options,
      });
    } catch (error) {
      console.error(`Error creating doughnut chart ${canvasId}:`, error);
    }
  }

  createEmptyChart(canvasId: string, title: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar mensaje de no datos
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos disponibles', canvas.width / 2, canvas.height / 2);
  }

  getChartColor(index: number): string {
    return this.chartColors.primary[index % this.chartColors.primary.length];
  }

  getSeverityColor(key: string): string {
    const index = this.getKeys(this.ticketsBySeverity).indexOf(key);
    return index >= 0
      ? this.severityColors[index % this.severityColors.length]
      : '#9CA3AF';
  }

  getStatusColor(key: string): string {
    const index = this.getKeys(this.ticketsByStatus).indexOf(key);
    return index >= 0
      ? this.statusColors[index % this.statusColors.length]
      : '#9CA3AF';
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  getTopEntries(
    data: { [key: string]: number },
    limit: number = 5
  ): { [key: string]: number } {
    if (!data) return {};

    const entries = Object.entries(data);
    // Ordenar por valor descendente
    entries.sort((a, b) => b[1] - a[1]);
    // Tomar los primeros 'limit' elementos
    const topEntries = entries.slice(0, limit);
    // Convertir de nuevo a objeto
    return Object.fromEntries(topEntries);
  }
}
