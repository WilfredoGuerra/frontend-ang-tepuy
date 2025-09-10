import { CommonModule, DatePipe, Location } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { FailuresService } from '@features/failures/services/failures.service';
import { FiberLength } from '@features/fiber-lengths/interfaces/fiber-length.interface';
import { FiberLengthsService } from '@features/fiber-lengths/services/fiber-lengths.service';
import { GroupsService } from '@features/groups/services/groups.service';
import { NetworkElementsService } from '@features/network-elements/services/network-elements.service';
import { OriginsService } from '@features/origins/services/origins.service';
import { PersonalRegionService } from '@features/personal-region/services/personal-region.service';
import { PlatformsService } from '@features/platforms/services/platforms.service';
import { ProgressTicket } from '@features/progress-ticket/interfaces/progress-ticket.interface';
import { ProgressTicketService } from '@features/progress-ticket/services/progress-ticket.service';
import { SeveritiesService } from '@features/severities/services/severities.service';
import { StatusesService } from '@features/statuses/services/statuses.service';
import { Ticket, TicketsResponse } from '@tickets/interfaces/ticket.interface';
import { TicketsService } from '@tickets/services/tickets.service';

@Component({
  selector: 'app-ticket-page',
  imports: [DatePipe, ReactiveFormsModule, CommonModule],
  templateUrl: './ticket-page.component.html',
  styles: `
        .ticket-content {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            padding: 0.5rem 0;
            align-items: center;
        }
        .field {
            display: inline-flex;
            white-space: nowrap;
            align-items: center;
            font-size: 0.875rem;
        }
        .field-name {
            font-weight: 600;
            color: #4b5563;
            margin-right: 0.1rem;
        }
        .comma-separator {
            color: #6b7280;
            margin: 0 0.1rem;
        }
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .network-section {
            border-radius: 0.5rem;
            padding: 0.25rem;
        }
  `
})
export class TicketPageComponent {
  // Servicios
  private activatedRoute = inject(ActivatedRoute);
  private ticketsService = inject(TicketsService);
  private progressTicketService = inject(ProgressTicketService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private location = inject(Location);

  // Servicios de datos
  private groupsService = inject(GroupsService);
  private originsService = inject(OriginsService);
  private severitiesService = inject(SeveritiesService);
  private failuresService = inject(FailuresService);
  private platformsService = inject(PlatformsService);
  private statusesService = inject(StatusesService);
  private personalsRegionService = inject(PersonalRegionService);
  private networkElementsService = inject(NetworkElementsService);
  private fiberLengthsService = inject(FiberLengthsService);
  private usersService = inject(AuthService);

  // IDs y estados
  ticketId = +this.activatedRoute.snapshot.params['id'];
  showModal = signal(false);
  isSubmitting = signal(false);
  selectedFiles = signal<File[]>([]);
  selectedElementType = signal<'network' | 'fiber'>('network');
  selectedElement = signal<any>(null);

  // Búsqueda y paginación
  searchNetworkElement = signal('');
  searchFiberLength = signal('');
  searchUser = signal('');
  currentNetworkPage = signal(1);
  currentFiberPage = signal(1);
  itemsPerPage = 10;

  // Señales para búsqueda en tiempo real
  searchNetworkQuery = signal('');
  searchFiberQuery = signal('');
  searchUserQuery = signal('');

  // Señales para paginación infinita
  allNetworkElements = signal<any[]>([]);
  allFiberLengths = signal<FiberLength[]>([]);
  allUsers = signal<any[]>([]);

  // Asignaciones de usuarios
  userAssignments = new Map<number, number>();

  // Formulario principal para nuevo seguimiento
  // Cambia la definición del formulario:
progressForm = this.fb.group({
  ticketId: [this.ticketId, Validators.required],
  statusId: [null as number | null, [Validators.required, Validators.min(1)]],
  groupId: [null as number | null, [Validators.required, Validators.min(1)]],
  severityId: [null as number | null, [Validators.required, Validators.min(1)]],
  platformId: [null as number | null, [Validators.required, Validators.min(1)]],
  originId: [null as number | null, [Validators.required, Validators.min(1)]],
  failureId: [null as number | null, [Validators.required, Validators.min(1)]],
  impact: [null as number | null, [Validators.min(0)]],
  assignedUserId: [null as number | null], // ← Eliminado Validators.required
  personalRegionId: [null as number | null],
  elementNetworkId: this.fb.control<number[]>([]),
  fiberLengthId: this.fb.control<number | null>(null),
  progress: [''],
  observations: ['', [Validators.required, Validators.minLength(10)]],
});

  allTicketsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => this.ticketsService.getTickets({}),
  });

  // Resources principales
  ticketResource = rxResource({
    params: () => ({ id: this.ticketId }),
    stream: ({ params }) => this.ticketsService.getTicketById(params.id),
  });

  progressTicketsResource = rxResource({
    params: () => ({ ticketId: this.ticketId }),
    stream: ({ params }) =>
      this.progressTicketService.getProgressTicketsByTicketId(params.ticketId),
  });

  // Resources para datos de selección
  groupsResource = rxResource({
    stream: () => this.groupsService.getGroups(),
  });

  originsResource = rxResource({
    stream: () => this.originsService.getOrigins(),
  });

  severitiesResource = rxResource({
    stream: () => this.severitiesService.getSeverities(),
  });

  failuresResource = rxResource({
    stream: () => this.failuresService.getFailures(),
  });

  platformsResource = rxResource({
    stream: () => this.platformsService.getPlatforms(),
  });

  statusesResource = rxResource({
    stream: () => this.statusesService.getStatuses(),
  });

  personalsRegionResource = rxResource({
    stream: () =>
      this.personalsRegionService.getPersonalRegion({ limit: 1000 }),
  });

  networkElementsResource = rxResource({
    stream: () =>
      this.networkElementsService.getNetworkElements({ limit: 10000 }),
  });

  fiberLengthsResource = rxResource({
    stream: () => this.fiberLengthsService.getFiberLengths({ limit: 1000 }),
  });

  usersResource = rxResource({
    stream: () => this.authService.getUsers?.({ limit: 1000 }),
  });

  // Resources para búsqueda
  searchedNetworkElements = rxResource({
    params: () => ({ search: this.searchNetworkQuery() }),
    stream: ({ params }) =>
      this.networkElementsService.getNetworkElementsSearch(params.search, {
        limit: 100,
      }),
  });

  searchedFiberLengths = rxResource({
    params: () => ({ search: this.searchFiberQuery() }),
    stream: ({ params }) =>
      this.fiberLengthsService.getFiberLengthsSearch(params.search, {
        limit: 100,
      }),
  });

  searchedUsers = rxResource({
    params: () => ({ search: this.searchUserQuery() }),
    stream: ({ params }) =>
      this.usersService.getUsersSearch(params.search, { limit: 100 }),
  });

  constructor() {
    // Efectos para resetear paginación al buscar
    effect(() => {
      this.searchNetworkElement();
      this.currentNetworkPage.set(1);
    });

    effect(() => {
      this.searchFiberLength();
      this.currentFiberPage.set(1);
    });
  }

  // Getters computados
  // get progressTickets(): ProgressTicket[] {
  //   return this.progressTicketsResource.value() || [];
  // }

// ngOnInit() {
//   // ... otro código

//   // Inicializar el array de estado de carga
//   this.ticketResource.valueChanges().subscribe(ticket => {
//     if (ticket?.images) {
//       this.imageLoaded.set(new Array(ticket.images.length).fill(false));
//     }
//   });
// }

  get progressTickets(): ProgressTicket[] {
    const tickets = this.progressTicketsResource.value() || [];
    const users = this.usersResource.value()?.users || [];
    const regions =
      this.personalsRegionResource.value()?.personalsRegions || [];
    const fiberLengths = this.fiberLengthsResource.value()?.fiberLengths || [];

    return tickets.map((ticket) => {
      // Usar el nombre correcto del campo
      const personalRegionId =
        (ticket as any).personal_region_id || ticket.personalRegionId;

      return {
        ...ticket,
        assignedUser: users.find((user) => user.id === ticket.assignedUserId),
        personal_region: regions.find(
          (region) => region.id === personalRegionId
        ),
        fiber_length: ticket.fiberLengthId
          ? fiberLengths.find((fiber) => fiber.id === ticket.fiberLengthId)
          : undefined,
      } as ProgressTicket;
    });
  }

  get progressTicketsCount(): number {
    return this.progressTickets.length;
  }

  get hasProgressTickets(): boolean {
    return this.progressTicketsCount > 0;
  }

  get filteredNetworkElements() {
    const search = this.searchNetworkElement().toLowerCase();
    const elements =
      this.networkElementsResource.value()?.networksElements || [];

    if (!search) return elements;

    return elements.filter(
      (element) =>
        element.acronym?.toLowerCase().includes(search) ||
        element.management_ip?.includes(search) ||
        element.service_ip?.includes(search)
    );
  }

  get paginatedNetworkElements() {
    const start = (this.currentNetworkPage() - 1) * this.itemsPerPage;
    return this.filteredNetworkElements.slice(start, start + this.itemsPerPage);
  }

  get filteredFiberLengths() {
    const search = this.searchFiberLength().toLowerCase();
    const fibers = this.fiberLengthsResource.value()?.fiberLengths || [];

    if (!search) return fibers;

    return fibers.filter((fiber) =>
      fiber.section_name?.toLowerCase().includes(search)
    );
  }

  get paginatedFiberLengths() {
    const start = (this.currentFiberPage() - 1) * this.itemsPerPage;
    return this.filteredFiberLengths.slice(start, start + this.itemsPerPage);
  }

  get filteredUsers() {
    const search = this.searchUser().toLowerCase();
    const users = this.usersResource.value()?.users || [];

    if (!search) return users;

    return users.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
    );
  }

  // Getters para los resultados de búsqueda
  get networkSearchResults() {
    const search = this.searchNetworkQuery().toLowerCase();
    if (!search) return this.allNetworkElements().slice(0, 50); // Mostrar primeros 50

    return this.allNetworkElements().filter(
      (element) =>
        element.acronym?.toLowerCase().includes(search) ||
        element.management_ip?.includes(search) ||
        element.service_ip?.includes(search)
    );
  }

  get fiberSearchResults() {
    const search = this.searchFiberQuery().toLowerCase();
    if (!search) return this.allFiberLengths().slice(0, 50);

    return this.allFiberLengths().filter((fiber) =>
      fiber.section_name?.toLowerCase().includes(search)
    );
  }

  get userSearchResults() {
    const search = this.searchUserQuery().toLowerCase();
    if (!search) return this.allUsers().slice(0, 50);

    return this.allUsers().filter(
      (user) =>
        user.fullName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
    );
  }

  // Cargar todos los datos al abrir el modal
  loadAllData() {
    // Cargar elementos de red
    this.networkElementsService.getNetworkElements({ limit: 10000 }).subscribe({
      next: (response) => {
        this.allNetworkElements.set(response.networksElements || []);
      },
      error: (error) => {
        console.error('Error loading network elements:', error);
      },
    });

    // Cargar tramos de fibra
    this.fiberLengthsService.getFiberLengths({ limit: 10000 }).subscribe({
      next: (response) => {
        this.allFiberLengths.set(response.fiberLengths || []);
        // console.log('Tramos de fibra cargados:', response.fiberLengths);
      },
      error: (error) => {
        console.error('Error loading fiber lengths:', error);
      },
    });

    // Cargar usuarios
    this.usersService.getUsers({ limit: 10000 }).subscribe({
      next: (response) => {
        this.allUsers.set(response.users || []);
      },
      error: (error) => {
        console.error('Error loading users:', error);
      },
    });
  }

  // Métodos de utilidad
  Math = Math;

  // Métodos de paginación
  nextNetworkPage() {
    const totalPages = Math.ceil(
      this.filteredNetworkElements.length / this.itemsPerPage
    );
    if (this.currentNetworkPage() < totalPages) {
      this.currentNetworkPage.set(this.currentNetworkPage() + 1);
    }
  }

  prevNetworkPage() {
    if (this.currentNetworkPage() > 1) {
      this.currentNetworkPage.set(this.currentNetworkPage() - 1);
    }
  }

  nextFiberPage() {
    const totalPages = Math.ceil(
      this.filteredFiberLengths.length / this.itemsPerPage
    );
    if (this.currentFiberPage() < totalPages) {
      this.currentFiberPage.set(this.currentFiberPage() + 1);
    }
  }

  prevFiberPage() {
    if (this.currentFiberPage() > 1) {
      this.currentFiberPage.set(this.currentFiberPage() - 1);
    }
  }

  // Métodos del modal
  openModal() {
    this.showModal.set(true);
    this.prefillFormWithTicketData();
    this.loadAllData(); // ← Cargar todos los datos
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFiles.set([]);
    this.selectedElement.set(null);
    this.selectedElementType.set('network');
    this.progressForm.reset({
      ticketId: this.ticketId,
      statusId: null,
      groupId: null,
      severityId: null,
      platformId: null,
      originId: null,
      failureId: null,
      impact: null,
      assignedUserId: null,
      personalRegionId: null,
      elementNetworkId: [],
      fiberLengthId: null,
      progress: '',
      observations: '',
    });
  }

  private prefillFormWithTicketData() {
    if (this.ticketResource.hasValue()) {
      const ticket = this.ticketResource.value();

    this.progressForm.patchValue({
      statusId: ticket.statusId || null,
      groupId: ticket.groupId || null,
      severityId: ticket.severityId || null,
      platformId: ticket.platformId || null,
      originId: ticket.originId || null,
      failureId: ticket.failureId || null,
      impact: ticket.impact || null,
      personalRegionId: ticket.personalRegionId || null,
      fiberLengthId: ticket.fiberLengthId || null,
      assignedUserId: null, // ← Establecer como null por defecto
    });

      if (ticket.network_elements?.length) {
        this.selectedElementType.set('network');
        this.selectedElement.set(ticket.network_elements[0]);
        this.progressForm.patchValue({
          elementNetworkId: [ticket.network_elements[0].id],
        });
      } else if (ticket.fiberLengthId) {
        this.selectedElementType.set('fiber');
        const fiberLength = this.fiberLengthsResource
          .value()
          ?.fiberLengths?.find((f) => f.id === ticket.fiberLengthId);
        if (fiberLength) {
          this.selectedElement.set(fiberLength);
        }
      }
    }
  }

  // Manejo de archivos
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      this.selectedFiles.set(Array.from(files));
    }
  }

  removeFile(index: number) {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);
  }

  // Método para seleccionar elemento de red
  selectNetworkElement(element: any) {
    this.selectedElement.set(element);
    this.selectedElementType.set('network');

    // Actualizar el formulario con el ID del elemento
    this.progressForm.patchValue({
      elementNetworkId: [element.id], // Array con el ID
      fiberLengthId: null, // Limpiar tramo de fibra
    });

    console.log('Elemento de red seleccionado:', element.id);
  }

  // Método para seleccionar tramo de fibra
  selectFiberLength(fiber: any) {
    this.selectedElement.set(fiber);
    this.selectedElementType.set('fiber');

    // Actualizar el formulario con el ID del tramo
    this.progressForm.patchValue({
      fiberLengthId: fiber.id, // ID directo
      elementNetworkId: [], // Limpiar elementos de red
    });

    console.log('Tramo de fibra seleccionado:', fiber.id);
  }

  // Asignación de usuarios
  onUserSelect(progressId: number, userId: string) {
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      this.userAssignments.set(progressId, numericId);
    }
  }

  assignUserToProgress(progressId: number) {
    const userId = this.userAssignments.get(progressId);
    if (userId) {
      console.log(
        `Asignando usuario ${userId} al progress ticket ${progressId}`
      );
      // this.progressTicketService.assignUser(progressId, userId).subscribe(...);
    }
  }

  // Envío del formulario
  async onSubmit() {
    if (this.progressForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.progressForm.value;
      const user = this.authService.user();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // DEBUG: Verificar valores del formulario
      // console.log('Valores del formulario:', formValue);
      // console.log('Tipo de elemento seleccionado:', this.selectedElementType());
      // console.log('Elemento seleccionado:', this.selectedElement());

      // console.log('Usuario autenticado (creador):', user);
      // console.log('Usuario asignado seleccionado:', formValue.assignedUserId);
      // console.log('Valores del formulario:', formValue);

      const getValue = (value: any, defaultValue: any) => {
        return value !== null && value !== undefined ? value : defaultValue;
      };

    const progressData: any = {
      ticketId: this.ticketId,
      assignedUserId: formValue.assignedUserId || null, // ← Puede ser null
      progress: getValue(formValue.progress, ''),
      observations: getValue(formValue.observations, ''),
      statusId: getValue(formValue.statusId, 0),
      groupId: getValue(formValue.groupId, 0),
      severityId: getValue(formValue.severityId, 0),
      platformId: getValue(formValue.platformId, 0),
      originId: getValue(formValue.originId, 0),
      failureId: getValue(formValue.failureId, 0),
      impact: getValue(formValue.impact, 0),
      personalRegionId: getValue(formValue.personalRegionId, 0),
      isActive: true,
    };

      // Diferentes formatos según lo que espere el backend
      if (
        this.selectedElementType() === 'network' &&
        formValue.elementNetworkId?.length
      ) {
        // Opción 1: Si el backend espera un array
        progressData.elementNetworkId = formValue.elementNetworkId;
        // Opción 2: Si el backend espera un solo ID
        // progressData.elementNetworkId = formValue.elementNetworkId[0];
      } else if (
        this.selectedElementType() === 'fiber' &&
        formValue.fiberLengthId
      ) {
        progressData.fiberLengthId = formValue.fiberLengthId;
      }

      // console.log('Datos finales a enviar:', progressData);

      this.progressTicketService.createProgressTicket(progressData).subscribe({
        next: (ticket) => {
          // console.log('Progress ticket creado:', ticket);
          this.closeModal();
          this.progressTicketsResource.reload();
        },
        error: (error) => {
          console.error('Error al crear progress ticket:', error);
        },
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Métodos para manejar cambios en la búsqueda
  onNetworkSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchNetworkQuery.set(value);
  }

  onFiberSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchFiberQuery.set(value);
  }

  onUserSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchUserQuery.set(value);
  }

  // Método para seleccionar usuario desde la lista de búsqueda
  selectUser(user: any) {
    this.progressForm.patchValue({
      assignedUserId: user.id,
    });
    this.searchUserQuery.set(''); // Limpiar búsqueda después de seleccionar
  }

  // Utilidades
  private markFormGroupTouched() {
    Object.keys(this.progressForm.controls).forEach((key) => {
      this.progressForm.get(key)?.markAsTouched();
    });
  }

  goBack() {
    this.location.back();
  }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  formatVenezuelaTime(dateString: string, format: string = 'h:mm a'): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const venezuelaOffset = -4 * 60;
    const localOffset = date.getTimezoneOffset();
    const venezuelaTime = new Date(
      date.getTime() + (localOffset - venezuelaOffset) * 60000
    );

    if (format === 'h:mm a') {
      const hours = venezuelaTime.getHours();
      const minutes = venezuelaTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    }

    const datePipe = new DatePipe('en-US');
    return datePipe.transform(venezuelaTime, format) || '';
  }

  // Método para manejar errores de carga de imágenes
// Método para manejar errores de carga de imágenes
handleImageError(event: Event) {
  const imgElement = event.target as HTMLImageElement;
  imgElement.style.display = 'none';

  // Opcional: mostrar un placeholder cuando falle la imagen
  const parent = imgElement.parentElement;
  if (parent) {
    const placeholder = document.createElement('div');
    placeholder.className = 'w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center';
    placeholder.innerHTML = `
      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    `;
    parent.appendChild(placeholder);
  }
}

// Método para extraer la URL de la imagen
getImageUrl(item: any): string {
  if (typeof item === 'string') {
    return item;
  }

  // Si es un objeto, buscar propiedades comunes
  return item?.url ||
         item?.secureUrl ||
         item?.imageUrl ||
         item?.path ||
         item;
}

imageLoaded = signal<boolean[]>([]);

// Método cuando la imagen carga exitosamente
onImageLoad(index: number) {
  const current = this.imageLoaded();
  current[index] = true;
  this.imageLoaded.set([...current]);
}


}
