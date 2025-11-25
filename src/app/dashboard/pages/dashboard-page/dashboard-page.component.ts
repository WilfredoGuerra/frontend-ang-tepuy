// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth/services/auth.service';

interface FiberCutState {
  state: string;
  count: number;
}

Chart.register(...registerables);

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard-page.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export default class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);

  fiberCutStates: any[] = [];
  totalFiberCuts: number = 0;

  // filterForm: FormGroup;
  isLoading = true;
  // filtersOpen = false;

  // Datos para gráficos y estadísticas
  stats: any = {};
  ticketsByGroup: any = {};
  ticketsByPlatform: any = {};
  ticketsBySeverity: any = {};
  ticketsByStatus: any = {};
  ticketsByOrigin: any = {};
  ticketsByFailure: any = {};
  fiberCutByState: any = {};

  // ticketsByUser: any = {};
  // recentTickets: any[] = [];
  // filterOptions: any = {};

  // Objeto para almacenar instancias de gráficos
  charts: { [key: string]: Chart } = {};

  private chartColors = {
    primary: [
      'rgba(102, 126, 234, 0.7)',
      'rgba(118, 75, 162, 0.7)',
      'rgba(234, 102, 102, 0.7)',
      'rgba(102, 234, 138, 0.7)',
      'rgba(234, 202, 102, 0.7)',
      'rgba(102, 217, 234, 0.7)',
      'rgba(234, 153, 102, 0.7)',
      'rgba(162, 102, 234, 0.7)',
      'rgba(102, 234, 195, 0.7)',
      'rgba(234, 102, 178, 0.7)',
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

  // Colores para los gráficos
  private severityColors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
  ];

  private statusColors = [
    'rgba(255, 159, 64, 0.8)',
    'rgba(201, 203, 207, 0.8)',
    'rgba(0, 162, 235, 0.8)',
    'rgba(153, 102, 0, 0.8)',
    'rgba(255, 128, 0, 0.8)',
  ];

  constructor(
    // private fb: FormBuilder,
    private dashboardService: DashboardService
  ) {
    // this.filterForm = this.fb.group({
    //   startDate: [''],
    //   endDate: [''],
    //   groupId: [''],
    //   platformId: [''],
    //   severityId: [''],
    //   statusId: [''],
    //   originId: [''],
    //   failureId: [''],
    //   userId: ['']
    // });
  }

  ngOnInit(): void {
    // this.loadFilterOptions();
    this.loadDashboardData();
    this.loadFiberCutData();
    // this.dashboardService.getTotalDashboardData().subscribe();
    // this.dashboardService.getTicketsByFiberLength().subscribe();

    // // Escuchar cambios en los filtros con debounce
    // this.filterForm.valueChanges
    //   .pipe(
    //     debounceTime(500),
    //     distinctUntilChanged()
    //   )
    //   .subscribe(() => {
    //     this.applyFilters();
    //   });
  }

  // toggleFilters(): void {
  //   this.filtersOpen = !this.filtersOpen;
  // }

  // loadFilterOptions(): void {
  //   this.dashboardService.getFilterOptions().subscribe({
  //     next: (options) => {
  //       this.filterOptions = options;
  //     },
  //     error: (error) => {
  //       console.error('Error loading filter options', error);
  //     }
  //   });
  // }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (data: any) => {
        this.stats = data.stats;
        this.ticketsByGroup = data.ticketsByGroup;
        this.ticketsByPlatform = data.ticketsByPlatform;
        this.ticketsBySeverity = data.ticketsBySeverity;
        this.ticketsByStatus = data.ticketsByStatus;
        this.ticketsByOrigin = data.ticketsByOrigin;
        this.ticketsByFailure = data.ticketsByFailure;
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
        this.fiberCutByState = data.topStates.reduce((acc: any, item: any) => {
          acc[item.state] = item.fiberCutsCount;
          return acc;
        }, {});

        // CALCULAR las propiedades UNA sola vez
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

  // AGREGAR este método nuevo:
  private calculateFiberCutProperties(): void {
    if (!this.fiberCutByState || typeof this.fiberCutByState !== 'object') {
      this.fiberCutStates = [];
      this.totalFiberCuts = 0;
      return;
    }

    try {
      const entries = Object.entries(this.fiberCutByState);

      // Calcular los estados ordenados
      this.fiberCutStates = entries
        .map(([state, count]) => ({
          state: state,
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count);

      // Calcular el total
      this.totalFiberCuts = this.fiberCutStates.reduce(
        (total, state) => total + state.count,
        0
      );

      // console.log('✅ Propiedades de cortes de fibra calculadas:', {
      //   states: this.fiberCutStates,
      //   total: this.totalFiberCuts
      // });
    } catch (error) {
      console.error('Error calculando propiedades de cortes de fibra:', error);
      this.fiberCutStates = [];
      this.totalFiberCuts = 0;
    }
  }

  // applyFilters(): void {
  //   this.loadDashboardData();
  // }

  // resetFilters(): void {
  //   this.filterForm.reset();
  //   this.loadDashboardData();
  // }

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
      this.ticketsBySeverity
    );
    this.createPieChart(
      'statusChart',
      'Tickets por Estado',
      this.ticketsByStatus
    );
    this.createBarChart(
      'originChart',
      'Tickets por Origen',
      this.ticketsByOrigin
    );
    this.createBarChart(
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

    const labels = Object.keys(data);
    const values = Object.values(data);

    const chartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [
        {
          label: 'Cantidad',
          data: values,
          backgroundColor: this.chartColors.primary.slice(0, labels.length),
          borderColor: this.chartColors.borders.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: title, font: { size: 16 } },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
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
    data: { [key: string]: number }
  ): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    const chartData: ChartData<'pie'> = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: this.chartColors.primary.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    };

    const options: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      layout: { padding: 20 },
    };

    this.charts[canvasId] = new Chart(canvas, {
      type: 'pie',
      data: chartData,
      options: options,
    });
  }

  //   getChartColor(index: number): string {
  //   return this.chartColors.primary[index % this.chartColors.primary.length];
  // }

  getChartColor(index: number): string {
    const colors = [
      'rgba(102, 126, 234, 0.9)', // Azul principal
      'rgba(118, 75, 162, 0.9)', // Púrpura
      'rgba(234, 102, 102, 0.9)', // Rojo
      'rgba(102, 234, 138, 0.9)', // Verde
      'rgba(234, 202, 102, 0.9)', // Amarillo
      'rgba(102, 217, 234, 0.9)', // Cyan
      'rgba(234, 153, 102, 0.9)', // Naranja
      'rgba(162, 102, 234, 0.9)', // Violeta
      'rgba(102, 234, 195, 0.9)', // Verde agua
      'rgba(234, 102, 178, 0.9)', // Rosa
    ];
    return colors[index % colors.length];
  }

  createDoughnutChart(
    canvasId: string,
    title: string,
    data: { [key: string]: number }
  ): void {
    try {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;

      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      const labels = Object.keys(data || {});
      const values = Object.values(data || {});

      if (labels.length === 0) return;

      // Usar los mismos colores que en la leyenda
      const backgroundColors = labels.map((_, index) =>
        this.getChartColor(index)
      );

      const chartData: ChartData<'doughnut'> = {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: backgroundColors, // ← Colores consistentes
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
            display: false, // Ocultamos la leyenda nativa porque tenemos la personalizada
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
        cutout: '55%', // Un poco más de agujero para mejor visualización
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

  getSeverityKeys(): string[] {
    return Object.keys(this.ticketsBySeverity);
  }

  getStatusKeys(): string[] {
    return Object.keys(this.ticketsByStatus);
  }

  getSeverityColor(key: string): string {
    const index = this.getSeverityKeys().indexOf(key);
    return index >= 0
      ? this.severityColors[index % this.severityColors.length]
      : '#ccc';
  }

  getStatusColor(key: string): string {
    const index = this.getStatusKeys().indexOf(key);
    return index >= 0
      ? this.statusColors[index % this.statusColors.length]
      : '#ccc';
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });
  }
}
