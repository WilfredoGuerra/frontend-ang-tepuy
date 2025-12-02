import {
  CommonModule,
  DatePipe,
  Location,
  TitleCasePipe,
} from '@angular/common';
import { Component, inject, signal, effect, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ClosuresService } from '@features/closures/services/closures.service';
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
import { Ticket } from '@tickets/interfaces/ticket.interface';
import { TicketsService } from '@tickets/services/tickets.service';
import Swal from 'sweetalert2';
import { CreateClosureDto } from '@features/closures/interfaces/closure.interface';
import { IncidentsService } from '@features/incidents/services/incidents.service';
import { IncidentsDetailsService } from '@features/incidents-details/services/incidents-details.service';
import { TicketImagePipe } from '@app-front/pipes/ticket-image.pipe';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Component({
  selector: 'app-ticket-page',
  imports: [DatePipe, ReactiveFormsModule, CommonModule, TicketImagePipe],
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
    .closure-info {
      border-left: 4px solid #10b981;
    }
    .cancellation-info {
      border-left: 4px solid #ef4444;
    }
    .impact-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

      @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out;
  }
  `,
})
export class TicketPageComponent {
  // Servicios
  private activatedRoute = inject(ActivatedRoute);
  private ticketsService = inject(TicketsService);
  private progressTicketService = inject(ProgressTicketService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private location = inject(Location);

  // Servicios de datos
  private groupsService = inject(GroupsService);
  private originsService = inject(OriginsService);
  private severitiesService = inject(SeveritiesService);
  private failuresService = inject(FailuresService);
  private platformsService = inject(PlatformsService);
  private personalsRegionService = inject(PersonalRegionService);
  private networkElementsService = inject(NetworkElementsService);
  private fiberLengthsService = inject(FiberLengthsService);
  private closuresService = inject(ClosuresService);
  private incidentsService = inject(IncidentsService);
  private incidentDetailsService = inject(IncidentsDetailsService);

  // IDs y estados
  ticketId = +this.activatedRoute.snapshot.params['id'];
  showModal = signal(false);
  isSubmitting = signal(false);
  isSubmittingClosure = signal(false);
  selectedFiles = signal<File[]>([]);
  selectedElementType = signal<'network' | 'fiber'>('network');
  // selectedElement = signal<any>(null);
  showNetworkElementModal = signal(false);
  selectedClosureNetworkElement = signal<any>(null);
  selectedClosureElementType = signal<'network' | 'fiber' | null>(null);
  selectedClosureFiberElement = signal<any>(null);
  showFiberElementModal = signal(false);
  fiberSearchQuery = signal('');
  showDateTimeAlert = signal(false);
  dateTimeAlertMessage = signal('');
  private alertTimeout: any = null;

  // Búsqueda y datos
  searchNetworkQuery = signal('');
  searchFiberQuery = signal('');
  searchUserQuery = signal('');
  closureNetworkSearchQuery = signal('');
  allNetworkElements = signal<any[]>([]);
  allFiberLengths = signal<FiberLength[]>([]);
  allUsers = signal<any[]>([]);

  selectedNetworkElements = signal<any[]>([]);
  selectedFiberElement = signal<any>(null);

  searchFiberModalQuery = signal(''); // Para modal de nueva documentación
  searchFiberClosureQuery = signal(''); // Para modal de cierre

  selectedClosureNetworkElements = signal<any[]>([]); // Para Elemento Afectado (solo lectura)
  selectedClosureNetworkElementsClosure = signal<any[]>([]); // Para Elemento de Cierre (editable)

  isGeneratingPdf = signal(false);

  imageUrl = computed(() => {
    return `${baseUrl}/files/ticket/${
      this.ticketResource.value()?.images?.[0]
    }`;
  });

  // Formularios
  progressForm = this.fb.group({
    ticketId: [this.ticketId, Validators.required],
    statusId: [null as number | null, [Validators.required, Validators.min(1)]],
    groupId: [null as number | null, [Validators.required, Validators.min(1)]],
    severityId: [
      null as number | null,
      [Validators.required, Validators.min(1)],
    ],
    platformId: [
      null as number | null,
      [Validators.required, Validators.min(1)],
    ],
    originId: [null as number | null, [Validators.required, Validators.min(1)]],
    failureId: [
      null as number | null,
      [Validators.required, Validators.min(1)],
    ],
    impact: [''],
    assignedUserId: [null as number | null],
    personalRegionId: [null as number | null],
    elementNetworkId: this.fb.control<number[]>([]),
    fiberLengthId: this.fb.control<number | null>(null),
    progress: [''],
    observations: ['', [Validators.required, Validators.minLength(10)]],
  });

  closureForm = this.fb.group({
    date_hlls: ['', Validators.required],
    date_hir: ['', Validators.required],
    date_hrs: ['', Validators.required],
    date_hff: ['', Validators.required],
    impacto_inter_bbip: [0],
    impacto_abon_voz: [0, [Validators.required, Validators.min(0)]],
    impacto_ptos_aba: [0, [Validators.required, Validators.min(0)]],
    impacto_inter_me: [0, [Validators.required, Validators.min(0)]],
    impacto_circuitos: [0, [Validators.required, Validators.min(0)]],
    impacto_intercon: [0, [Validators.required, Validators.min(0)]],
    action_taken: ['', [Validators.required, Validators.minLength(10)]],
    groupId: [null as number | null, Validators.required],
    networkElementIds: this.fb.control<number[]>([]), // Para elemento afectado (solo lectura)
    networkElementClosureIds: this.fb.control<number[]>([]), // Para elemento de cierre (editable)
    fiberLengthId: [null as number | null],
    incidentId: [null as number | null, Validators.required],
    incidentDetailId: [null as number | null, Validators.required],
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
  groupsResource = rxResource({ stream: () => this.groupsService.getGroups() });
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
  incidentsResource = rxResource({
    stream: () => this.incidentsService.getIncidents(),
  });
  incidentDetailsResource = rxResource({
    stream: () => this.incidentDetailsService.getIncidentsDetails(),
  });

  constructor() {
    effect(() => {
      const ticket = this.ticketResource.value();
      if (ticket?.closure || ticket?.statusId === 2) {
        this.showModal.set(false);
      }
    });

    effect(() => {
      if (this.ticketResource.hasValue()) {
        this.prefillClosureForm();
      }
    });

    effect(() => {
      if (this.progressTicketsResource.hasValue()) {
        this.prefillClosureForm();
      }
    });

    this.closureForm.get('date_hlls')?.valueChanges.subscribe(() => {
      this.onDateHllsChange();
    });

    this.closureForm.get('date_hir')?.valueChanges.subscribe(() => {
      this.onDateHirChange();
    });

    this.closureForm.get('date_hrs')?.valueChanges.subscribe(() => {
      this.onDateHrsChange();
    });

    this.closureForm.get('date_hff')?.valueChanges.subscribe(() => {
      this.onDateHffChange();
    });

    this.closureForm.get('incidentId')?.valueChanges.subscribe((incidentId) => {
      const incidentDetailControl = this.closureForm.get('incidentDetailId');

      if (incidentId) {
        incidentDetailControl?.enable();
      } else {
        incidentDetailControl?.disable();
        incidentDetailControl?.setValue(null);
      }
    });

    const initialIncidentId = this.closureForm.get('incidentId')?.value;
    const incidentDetailControl = this.closureForm.get('incidentDetailId');

    if (!initialIncidentId) {
      incidentDetailControl?.disable();
    }
  }

  ngOnDestroy() {
    // Limpiar el timeout del alert
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  private showDateTimeError(message: string): void {
    // Limpiar timeout anterior si existe
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    this.dateTimeAlertMessage.set(message);
    this.showDateTimeAlert.set(true);

    // Ocultar automáticamente después de 3 segundos
    this.alertTimeout = setTimeout(() => {
      this.showDateTimeAlert.set(false);
    }, 5000);
  }

  private validateClosureDates(): boolean {
    const ticket = this.ticketResource.value();
    if (!ticket?.date_hct) {
      this.showDateTimeError(
        'No se encuentra la hora de contacto técnico del ticket'
      );
      return false;
    }

    const dateHllsValue = this.closureForm.get('date_hlls')?.value;
    const dateHirValue = this.closureForm.get('date_hir')?.value;
    const dateHrsValue = this.closureForm.get('date_hrs')?.value;
    const dateHffValue = this.closureForm.get('date_hff')?.value;

    // ✅ VERIFICAR QUE LOS CAMPOS NO ESTÉN VACÍOS
    if (!dateHllsValue || !dateHirValue || !dateHrsValue || !dateHffValue) {
      this.showDateTimeError('Todos los campos de fecha/hora son requeridos');
      return false;
    }

    const dateHct = new Date(ticket.date_hct);
    const dateHlls = new Date(dateHllsValue);
    const dateHir = new Date(dateHirValue);
    const dateHrs = new Date(dateHrsValue);
    const dateHff = new Date(dateHffValue);

    // Validación 1: HLLS debe ser mayor o igual a HCT
    if (dateHlls && dateHlls < dateHct) {
      this.showDateTimeError(
        'La hora de llegada al sitio no puede ser anterior a la hora de contacto técnico'
      );
      return false;
    }

    // Validación 2: HIR debe ser mayor o igual a HLLS
    if (dateHir && dateHlls && dateHir < dateHlls) {
      this.showDateTimeError(
        'La hora de inicio de reparación no puede ser anterior a la hora de llegada al sitio'
      );
      return false;
    }

    // Validación 3: HRS debe ser mayor o igual a HIR
    if (dateHrs && dateHir && dateHrs < dateHir) {
      this.showDateTimeError(
        'La hora de restablecimiento de servicio no puede ser anterior a la hora de inicio de reparación'
      );
      return false;
    }

    // Validación 4: HFF debe ser mayor o igual a HRS
    if (dateHff && dateHrs && dateHff < dateHrs) {
      this.showDateTimeError(
        'La hora de fin de falla no puede ser anterior a la hora de restablecimiento de servicio'
      );
      return false;
    }

    return true;
  }

  onDateHllsChange(): void {
    const dateHllsValue = this.closureForm.get('date_hlls')?.value;
    const ticket = this.ticketResource.value();

    if (!dateHllsValue || !ticket?.date_hct) return;

    const selectedDate = new Date(dateHllsValue);
    const contactoDate = new Date(ticket.date_hct);

    if (selectedDate < contactoDate) {
      this.showDateTimeError(
        'La hora de llegada al sitio no puede ser anterior a la hora de contacto técnico'
      );
      this.closureForm.patchValue({ date_hlls: '' });
    }
  }

  onDateHirChange(): void {
    const dateHirValue = this.closureForm.get('date_hir')?.value;
    const dateHllsValue = this.closureForm.get('date_hlls')?.value;

    if (!dateHirValue || !dateHllsValue) return;

    const selectedDate = new Date(dateHirValue);
    const llegadaDate = new Date(dateHllsValue);

    if (selectedDate < llegadaDate) {
      this.showDateTimeError(
        'La hora de inicio de reparación no puede ser anterior a la hora de llegada al sitio'
      );
      this.closureForm.patchValue({ date_hir: '' });
    }
  }

  onDateHrsChange(): void {
    const dateHrsValue = this.closureForm.get('date_hrs')?.value;
    const dateHirValue = this.closureForm.get('date_hir')?.value;

    if (!dateHrsValue || !dateHirValue) return;

    const selectedDate = new Date(dateHrsValue);
    const inicioReparacionDate = new Date(dateHirValue);

    if (selectedDate < inicioReparacionDate) {
      this.showDateTimeError(
        'La hora de restablecimiento de servicio no puede ser anterior a la hora de inicio de reparación'
      );
      this.closureForm.patchValue({ date_hrs: '' });
    }
  }

  onDateHffChange(): void {
    const dateHffValue = this.closureForm.get('date_hff')?.value;
    const dateHrsValue = this.closureForm.get('date_hrs')?.value;

    if (!dateHffValue || !dateHrsValue) return;

    const selectedDate = new Date(dateHffValue);
    const restablecimientoDate = new Date(dateHrsValue);

    if (selectedDate < restablecimientoDate) {
      this.showDateTimeError(
        'La hora de fin de falla no puede ser anterior a la hora de restablecimiento de servicio'
      );
      this.closureForm.patchValue({ date_hff: '' });
    }
  }

  isDateHllsInvalid(): boolean {
    const dateHllsValue = this.closureForm.get('date_hlls')?.value;
    const ticket = this.ticketResource.value();

    if (!dateHllsValue || !ticket?.date_hct) return false;

    const selectedDate = new Date(dateHllsValue);
    const contactoDate = new Date(ticket.date_hct);
    return selectedDate < contactoDate;
  }

  isDateHirInvalid(): boolean {
    const dateHirValue = this.closureForm.get('date_hir')?.value;
    const dateHllsValue = this.closureForm.get('date_hlls')?.value;

    if (!dateHirValue || !dateHllsValue) return false;

    const selectedDate = new Date(dateHirValue);
    const llegadaDate = new Date(dateHllsValue);
    return selectedDate < llegadaDate;
  }

  isDateHrsInvalid(): boolean {
    const dateHrsValue = this.closureForm.get('date_hrs')?.value;
    const dateHirValue = this.closureForm.get('date_hir')?.value;

    if (!dateHrsValue || !dateHirValue) return false;

    const selectedDate = new Date(dateHrsValue);
    const inicioReparacionDate = new Date(dateHirValue);
    return selectedDate < inicioReparacionDate;
  }

  isDateHffInvalid(): boolean {
    const dateHffValue = this.closureForm.get('date_hff')?.value;
    const dateHrsValue = this.closureForm.get('date_hrs')?.value;

    if (!dateHffValue || !dateHrsValue) return false;

    const selectedDate = new Date(dateHffValue);
    const restablecimientoDate = new Date(dateHrsValue);
    return selectedDate < restablecimientoDate;
  }

  // Getters computados
  get progressTickets(): ProgressTicket[] {
    const tickets = this.progressTicketsResource.value() || [];

    // tickets.forEach((progress, index) => {
    //   console.log(`Progress ${index} (ID: ${progress.id}):`, {
    //     networkElements: progress.network_elements,
    //     networkElementsCount: progress.network_elements?.length,
    //     fiberLength: progress.fiberLength,
    //     elementNetworkIds: (progress as any).elementNetworkId,
    //   });
    // });

    const users = this.usersResource.value()?.users || [];
    const regions =
      this.personalsRegionResource.value()?.personalsRegions || [];
    const fiberLengths = this.fiberLengthsResource.value()?.fiberLengths || [];

    return tickets.map((ticket) => {
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

  get networkSearchResults() {
    const search = this.searchNetworkQuery().toLowerCase();
    if (!search) return this.allNetworkElements().slice(0, 50);
    return this.allNetworkElements().filter(
      (element) =>
        element.acronym?.toLowerCase().includes(search) ||
        element.management_ip?.includes(search) ||
        element.service_ip?.includes(search)
    );
  }

  get fiberSearchResults() {
    const search = this.searchFiberQuery().toLowerCase();
    const allFibers = this.fiberLengthsResource.value()?.fiberLengths || [];

    if (!search) return allFibers.slice(0, 50);

    return allFibers.filter(
      (fiber) =>
        fiber.section_name?.toLowerCase().includes(search) ||
        fiber.stateA?.state?.toLowerCase().includes(search) ||
        fiber.stateB?.state?.toLowerCase().includes(search)
    );
  }

  get modalFiberSearchResults() {
    const search = this.searchFiberModalQuery().toLowerCase();
    const allFibers = this.fiberLengthsResource.value()?.fiberLengths || [];

    if (!search) return allFibers.slice(0, 50);

    return allFibers.filter(
      (fiber) =>
        fiber.section_name?.toLowerCase().includes(search) ||
        (fiber.stateA?.state &&
          fiber.stateA.state.toLowerCase().includes(search)) ||
        (fiber.stateB?.state &&
          fiber.stateB.state.toLowerCase().includes(search))
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

  get closureNetworkSearchResults() {
    const search = this.closureNetworkSearchQuery().toLowerCase();
    const allElements =
      this.networkElementsResource.value()?.networksElements || [];

    if (!search) return allElements.slice(0, 50);

    return allElements.filter(
      (element: any) =>
        element.acronym?.toLowerCase().includes(search) ||
        element.management_ip?.includes(search) ||
        element.service_ip?.includes(search) ||
        element.description?.toLowerCase().includes(search) ||
        element.model?.toLowerCase().includes(search) ||
        element.central?.central_name?.toLowerCase().includes(search)
    );
  }

  get closureElementButtonText(): string {
    const elementType = this.selectedClosureElementType();

    if (elementType === 'network' && this.selectedClosureNetworkElement()) {
      const element = this.selectedClosureNetworkElement();
      return `RED: ${element.acronym} - ${element.description}`;
    } else if (elementType === 'fiber' && this.selectedClosureFiberElement()) {
      const fiber = this.selectedClosureFiberElement();
      return `FIBRA: ${fiber.section_name}`;
    } else {
      return 'Seleccionar Elemento (Red o Fibra)';
    }
  }

  filteredIncidentDetails() {
    const incidentId = this.closureForm.get('incidentId')?.value;
    const allDetails = this.incidentDetailsResource.value() || [];
    if (!incidentId) return allDetails;
    return allDetails.filter((detail: any) => detail.incidentId === incidentId);
  }

  get closureFiberSearchResults() {
    const search = this.searchFiberClosureQuery().toLowerCase();
    const allFibers = this.fiberLengthsResource.value()?.fiberLengths || [];

    if (!search) return allFibers.slice(0, 50);

    return allFibers.filter(
      (fiber) =>
        fiber.section_name?.toLowerCase().includes(search) ||
        (fiber.stateA?.state &&
          fiber.stateA.state.toLowerCase().includes(search)) ||
        (fiber.stateB?.state &&
          fiber.stateB.state.toLowerCase().includes(search))
    );
  }

  onFiberModalSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchFiberModalQuery.set(value);
  }

  onFiberClosureSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchFiberClosureQuery.set(value);
  }

  // Métodos principales
  canCreateNewProgress(): boolean {
    const ticket = this.ticketResource.value();
    return !!ticket && !ticket?.closure && ticket?.statusId !== 2;
  }

  // Métodos de formulario de seguimiento
  openModal() {
    this.showModal.set(true);
    this.loadAllData();

    setTimeout(() => {
      this.prefillFormWithTicketData();
      this.prefillElementsFromTicket(); // Nuevo método
    }, 100);
  }

  private prefillElementsFromTicket() {
    const ticket = this.ticketResource.value();

    console.log('Ticket elements:', ticket?.network_elements); // Debug

    // Cargar elementos de red existentes - ✅ CORREGIR: usar todos los elementos
    if (ticket?.network_elements?.length) {
      this.selectedNetworkElements.set([...ticket.network_elements]);
      this.selectedElementType.set('network');
      console.log(
        'Prefilled network elements:',
        this.selectedNetworkElements().length
      ); // Debug
    }
    // Cargar tramo de fibra existente
    else if (ticket?.fiberLengthId && ticket.fiber_length) {
      this.selectedFiberElement.set(ticket.fiber_length);
      this.selectedElementType.set('fiber');
    }

    // Actualizar el formulario con los elementos cargados
    this.updateFormWithSelectedElements();
  }

  private updateFormWithSelectedElements() {
    const networkIds = this.selectedNetworkElements().map((el) => el.id);
    const fiberId = this.selectedFiberElement()?.id || null;

    this.progressForm.patchValue({
      elementNetworkId: networkIds,
      fiberLengthId: fiberId,
    });

    console.log('Form updated:', { networkIds, fiberId }); // Para debug
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFiles.set([]);
    this.selectedNetworkElements.set([]);
    this.selectedFiberElement.set(null);
    // this.selectedElement.set(null);
    this.selectedElementType.set('network');
    this.searchFiberModalQuery.set(''); // Limpiar búsqueda del modal
    this.searchNetworkQuery.set('');
    this.progressForm.reset({
      ticketId: this.ticketId,
      statusId: null,
      groupId: null,
      severityId: null,
      platformId: null,
      originId: null,
      failureId: null,
      impact: '',
      assignedUserId: null,
      personalRegionId: null,
      elementNetworkId: [],
      fiberLengthId: null,
      progress: '',
      observations: '',
    });
  }

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

      const progressData: any = {
        ticketId: this.ticketId,
        assignedUserId: formValue.assignedUserId || null,
        progress: formValue.progress || '',
        observations: formValue.observations || '',
        statusId: formValue.statusId || 0,
        groupId: formValue.groupId || 0,
        severityId: formValue.severityId || 0,
        platformId: formValue.platformId || 0,
        originId: formValue.originId || 0,
        failureId: formValue.failureId || 0,
        impact: formValue.impact || '',
        personalRegionId: formValue.personalRegionId || null,
        isActive: true,
      };

      // if (
      //   this.selectedElementType() === 'network' &&
      //   formValue.elementNetworkId?.length
      // ) {
      //   progressData.elementNetworkId = formValue.elementNetworkId;
      // } else if (
      //   this.selectedElementType() === 'fiber' &&
      //   formValue.fiberLengthId
      // ) {
      //   progressData.fiberLengthId = formValue.fiberLengthId;
      // }
      if (
        this.selectedElementType() === 'network' &&
        this.selectedNetworkElements().length > 0
      ) {
        progressData.elementNetworkId = this.selectedNetworkElements().map(
          (el) => el.id
        );
      } else if (
        this.selectedElementType() === 'fiber' &&
        this.selectedFiberElement()
      ) {
        progressData.fiberLengthId = this.selectedFiberElement().id;
      }

      const selectedFiles = this.selectedFiles();

      this.progressTicketService
        .createProgressTicket(
          progressData,
          selectedFiles.length > 0
            ? this.createFileList(selectedFiles)
            : undefined
        )
        .subscribe({
          next: () => {
            this.closeModal();
            this.progressTicketsResource.reload();
            this.ticketResource.reload();
            this.showSuccessAlert('El seguimiento se creó correctamente');
          },
          error: (error) => {
            this.handleError('Error al crear el seguimiento', error);
          },
          complete: () => {
            this.isSubmitting.set(false);
          },
        });
    } catch (error) {
      this.handleError('Error inesperado', error);
      this.isSubmitting.set(false);
    }
  }

  // Métodos de formulario de cierre
  async onSubmitClosure() {
    if (this.closureForm.invalid) {
      this.markFormGroupTouchedClosure(this.closureForm);
      return;
    }

    if (!this.validateClosureDates()) {
      return;
    }

    this.isSubmittingClosure.set(true);

    try {
      const formValue = this.closureForm.value;

      if (
        !formValue.groupId ||
        !formValue.incidentId ||
        !formValue.incidentDetailId
      ) {
        this.showErrorAlert('Complete todos los campos requeridos');
        return;
      }

      const hasNetworkElements =
        formValue.networkElementClosureIds &&
        formValue.networkElementClosureIds.length > 0;
      const hasFiberElement = !!formValue.fiberLengthId;

      if (!hasNetworkElements && !hasFiberElement) {
        this.showErrorAlert(
          'Debe seleccionar al menos un elemento de red o un tramo de fibra para el cierre'
        );
        return;
      }

      const closureData: any = {
        id_ticket: this.ticketId,
        date_hlls: new Date(formValue.date_hlls!).toISOString(),
        date_hir: new Date(formValue.date_hir!).toISOString(),
        date_hrs: new Date(formValue.date_hrs!).toISOString(),
        date_hff: new Date(formValue.date_hff!).toISOString(),
        impacto_inter_bbip: formValue.impacto_inter_bbip!,
        impacto_abon_voz: formValue.impacto_abon_voz!,
        impacto_ptos_aba: formValue.impacto_ptos_aba!,
        impacto_inter_me: formValue.impacto_inter_me!,
        impacto_circuitos: formValue.impacto_circuitos!,
        impacto_intercon: formValue.impacto_intercon!,
        action_taken: formValue.action_taken!,
        groupId: formValue.groupId,
        networkElementIds: formValue.networkElementIds || [], // ✅ Para elemento afectado
        networkElementClosureIds: formValue.networkElementClosureIds || [], // ✅ Para elemento de cierre
        fiberLengthId: formValue.fiberLengthId || undefined,
        incidentId: formValue.incidentId,
        incidentDetailId: formValue.incidentDetailId,
      };

      this.closuresService.createClosure(closureData).subscribe({
        next: () => {
          this.showSuccessAlert('Ticket cerrado correctamente');
          this.ticketResource.reload();
          this.closureForm.reset();
          this.selectedClosureNetworkElements.set([]);
          this.selectedClosureNetworkElementsClosure.set([]);
          this.selectedClosureFiberElement.set(null);
          this.selectedClosureElementType.set(null);
        },
        error: (error) => {
          this.handleError('Error al cerrar el ticket', error);
        },
        complete: () => {
          this.isSubmittingClosure.set(false);
        },
      });
    } catch (error) {
      this.handleError('Error inesperado al cerrar el ticket', error);
      this.isSubmittingClosure.set(false);
    }
  }

  async onCancelTicket() {
    const confirmation = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción cancelará el ticket y no se podrá revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'No, mantener',
    });

    if (!confirmation.isConfirmed) return;

    const { value: cancellationNote } = await Swal.fire({
      title: 'Motivo de cancelación',
      text: 'Por favor, ingrese el motivo de la cancelación',
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Motivo requerido',
      inputPlaceholder: 'Describa el motivo de la cancelación...',
      inputAttributes: { 'aria-label': 'Ingrese el motivo de cancelación' },
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar un motivo para cancelar el ticket';
        if (value.length < 5)
          return 'El motivo debe tener al menos 5 caracteres';
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar cancelación',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (cancellationNote) {
      this.processTicketCancellation(cancellationNote);
    }
  }

  // Métodos de utilidad
  private processTicketCancellation(cancellationNote: string) {
    this.isSubmittingClosure.set(true);

    const user = this.authService.user();

    if (!user) {
      this.showErrorAlert('No se pudo identificar al usuario actual');
      this.isSubmittingClosure.set(false);
      return;
    }

    const updateData = {
      statusId: 2,
      cancellation_note: cancellationNote.trim(),
      cancelledById: user.id, // ✅ NUEVO: Usuario que cancela
      cancelledAt: new Date().toISOString(), // ✅ NUEVO: Timestamp de cancelación
    };

    this.ticketsService.updateTicket(this.ticketId, updateData).subscribe({
      next: () => {
        this.showSuccessAlert('El ticket ha sido cancelado correctamente');
        this.ticketResource.reload();
      },
      error: (error) => {
        this.handleError('No se pudo cancelar el ticket', error);
      },
      complete: () => {
        this.isSubmittingClosure.set(false);
      },
    });
  }

  // Métodos de selección de elementos
  selectNetworkElement(element: any) {
    // this.selectedElement.set(element);
    this.selectedElementType.set('network');
    this.progressForm.patchValue({
      elementNetworkId: [element.id],
      fiberLengthId: null,
    });
  }

  selectFiberLength(fiber: any) {
    this.selectedFiberElement.set(fiber);
    this.selectedNetworkElements.set([]); // Limpiar elementos de red
    this.selectedElementType.set('fiber');
    this.updateFormWithSelectedElements(); // ✅ AGREGAR ESTA LÍNEA
  }

  selectUser(user: any) {
    this.progressForm.patchValue({ assignedUserId: user.id });
    this.searchUserQuery.set('');
  }

  // Métodos para elementos de red en cierre
  openNetworkElementModal() {
    this.showNetworkElementModal.set(true);
  }

  closeNetworkElementModal() {
    this.showNetworkElementModal.set(false);
    this.closureNetworkSearchQuery.set('');
  }

  // selectClosureNetworkElement(element: any) {
  //   this.selectedClosureElementType.set('network');
  //   this.selectedClosureNetworkElement.set(element);
  //   this.selectedClosureFiberElement.set(null);
  //   this.closureForm.patchValue({
  //     networkElementId: element.id,
  //     fiberLengthId: null,
  //   });
  //   this.closeNetworkElementModal();
  // }

  selectClosureNetworkElement(element: any) {
    this.addClosureNetworkElement(element);
  }

  // clearClosureNetworkElement() {
  //   this.selectedClosureNetworkElement.set(null);
  //   this.selectedClosureElementType.set(null);
  //   this.closureForm.patchValue({ networkElementId: null });
  // }

  clearClosureNetworkElement() {
    this.selectedClosureNetworkElementsClosure.set([]);
    this.selectedClosureElementType.set(null);
    this.closureForm.patchValue({
      networkElementClosureIds: [],
      networkElementIds: this.selectedClosureNetworkElements().map(
        (el) => el.id
      ),
    });
  }

  clearClosureFiberElement() {
    this.selectedClosureFiberElement.set(null);
    this.selectedClosureElementType.set(null);
    this.closureForm.patchValue({ fiberLengthId: null });
  }

  // Métodos de manejo de archivos
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 5 * 1024 * 1024) {
          this.showWarningAlert(
            `El archivo ${file.name} excede el límite de 5MB`
          );
          continue;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          this.showWarningAlert(
            `El archivo ${file.name} no es una imagen válida (solo JPG, PNG, GIF)`
          );
          continue;
        }

        validFiles.push(file);
      }

      const currentFiles = this.selectedFiles();
      const totalFiles = [...currentFiles, ...validFiles].slice(0, 5);
      this.selectedFiles.set(totalFiles);

      if (totalFiles.length >= 5) {
        this.showInfoAlert(
          'Límite alcanzado',
          'Máximo 5 archivos permitidos',
          1500
        );
      }
    }
  }

  removeFile(index: number) {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);
  }

  // Métodos de ayuda
  private loadAllData() {
    this.networkElementsService.getNetworkElements({ limit: 10000 }).subscribe({
      next: (response) =>
        this.allNetworkElements.set(response.networksElements || []),
      error: (error) =>
        this.handleError('Error loading network elements', error),
    });

    this.fiberLengthsService.getFiberLengths({ limit: 10000 }).subscribe({
      next: (response) => this.allFiberLengths.set(response.fiberLengths || []),
      error: (error) => this.handleError('Error loading fiber lengths', error),
    });

    this.authService.getUsers({ limit: 10000 }).subscribe({
      next: (response) => this.allUsers.set(response.users || []),
      error: (error) => this.handleError('Error loading users', error),
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
        impact: ticket.impact,
        personalRegionId: ticket.personalRegionId || null,
        assignedUserId: null,
      });
    }
  }

  private prefillClosureForm() {
    if (this.ticketResource.hasValue()) {
      const ticket = this.ticketResource.value();
      this.closureForm.patchValue({ groupId: ticket.groupId || null });

      // ✅ SOLO llamar al nuevo método - eliminar toda la lógica vieja
      this.prefillClosureElements();
    }
  }

  // private prefillClosureForm() {
  //   if (this.ticketResource.hasValue()) {
  //     const ticket = this.ticketResource.value();
  //     this.closureForm.patchValue({ groupId: ticket.groupId || null });
  //     this.prefillClosureElements();

  //     const lastProgressElement = this.getLastProgressElement();

  //     // Establecer el tipo basado en el elemento de la última documentación
  //     if (lastProgressElement) {
  //       this.selectedClosureElementType.set(lastProgressElement.type);
  //     }

  //     const lastElement = this.getLastElementFromProgressTickets();

  //     if (lastElement.type === 'network' && lastElement.element) {
  //       this.selectedClosureElementType.set('network');
  //       this.selectedClosureNetworkElement.set(lastElement.element);
  //       this.closureForm.patchValue({
  //         networkElementId: lastElement.element.id,
  //         fiberLengthId: null,
  //       });
  //     } else if (lastElement.type === 'fiber' && lastElement.element) {
  //       const completeFiber =
  //         this.fiberLengthsResource
  //           .value()
  //           ?.fiberLengths?.find((f) => f.id === lastElement.element.id) ||
  //         lastElement.element;

  //       this.selectedClosureElementType.set('fiber');
  //       this.selectedClosureFiberElement.set(completeFiber);
  //       this.closureForm.patchValue({
  //         fiberLengthId: completeFiber.id,
  //         networkElementId: null,
  //       });
  //     } else {
  //       if (ticket.network_elements?.length) {
  //         this.selectedClosureElementType.set('network');
  //         this.selectedClosureNetworkElement.set(ticket.network_elements[0]);
  //         this.closureForm.patchValue({
  //           networkElementId: ticket.network_elements[0].id,
  //           fiberLengthId: null,
  //         });
  //       } else if (ticket.fiberLengthId && ticket.fiber_length) {
  //         const completeFiber =
  //           this.fiberLengthsResource
  //             .value()
  //             ?.fiberLengths?.find((f) => f.id === ticket.fiberLengthId) ||
  //           ticket.fiber_length;

  //         this.selectedClosureElementType.set('fiber');
  //         this.selectedClosureFiberElement.set(completeFiber);
  //         this.closureForm.patchValue({
  //           fiberLengthId: ticket.fiberLengthId,
  //           networkElementId: null,
  //         });
  //       }
  //     }
  //   }
  // }

  debugSelectedFiber() {
    console.log('=== DEBUG Selected Fiber ===');
    console.log('Fiber object:', this.selectedClosureFiberElement());
    console.log('StateA:', this.selectedClosureFiberElement()?.stateA);
    console.log('StateB:', this.selectedClosureFiberElement()?.stateB);
    console.log(
      'StateA type:',
      typeof this.selectedClosureFiberElement()?.stateA
    );
    console.log(
      'StateB type:',
      typeof this.selectedClosureFiberElement()?.stateB
    );
    console.log('=== END DEBUG ===');
  }

  // private prefillNewProgressWithLastElement() {
  //   const lastElement = this.getLastElementFromProgressTickets();
  //   const ticket = this.ticketResource.value();

  //   if (lastElement.type === 'network' && lastElement.element) {
  //     this.selectedElementType.set('network');
  //     this.selectedElementType.set(lastElement.element);
  //     this.progressForm.patchValue({
  //       elementNetworkId: [lastElement.element.id],
  //       fiberLengthId: null,
  //     });
  //   } else if (lastElement.type === 'fiber' && lastElement.element) {
  //     this.selectedElementType.set('fiber');
  //     this.selectedElementType.set(lastElement.element);
  //     this.progressForm.patchValue({
  //       fiberLengthId: lastElement.element.id,
  //       elementNetworkId: [],
  //     });
  //   } else {
  //     if (ticket?.network_elements?.length) {
  //       this.selectedElementType.set('network');
  //       // this.selectedElement.set(ticket.network_elements[0]);]
  //       this.progressForm.patchValue({
  //         elementNetworkId: [ticket.network_elements[0].id],
  //         fiberLengthId: null,
  //       });
  //     } else if (ticket?.fiberLengthId && ticket.fiber_length) {
  //       this.selectedElementType.set('fiber');
  //       // this.selectedElement.set(ticket.fiber_length);
  //       this.progressForm.patchValue({
  //         fiberLengthId: ticket.fiberLengthId,
  //         elementNetworkId: [],
  //       });
  //     }
  //   }
  // }

  getLastElementFromProgressTickets(): {
    type: 'network' | 'fiber' | null;
    element: any;
  } {
    if (!this.hasProgressTickets) {
      return { type: null, element: null };
    }

    // El array está ordenado de MÁS RECIENTE (índice 0) a MÁS ANTIGUO (último índice)
    for (let i = 0; i < this.progressTickets.length; i++) {
      const progress = this.progressTickets[i];

      // Verificar si tiene elementos de red
      if (progress.network_elements && progress.network_elements.length > 0) {
        return {
          type: 'network',
          element: progress.network_elements[0],
        };
      }

      // Verificar si tiene tramo de fibra
      if (progress.fiberLengthId && progress.fiberLength) {
        return {
          type: 'fiber',
          element: progress.fiberLength,
        };
      }

      // Verificar si tiene fiberLengthId aunque no tenga la relación cargada
      if (progress.fiberLengthId && !progress.fiberLength) {
        const fiber = this.fiberLengthsResource
          .value()
          ?.fiberLengths?.find((f) => f.id === progress.fiberLengthId);
        if (fiber) {
          return {
            type: 'fiber',
            element: fiber,
          };
        }
      }
    }

    return { type: null, element: null };
  }

  // Handlers de eventos
  onIncidentChange(event: any) {
    const incidentId = event.target.value;
    this.closureForm.patchValue({ incidentDetailId: null });
  }

  onNetworkSearchChange(event: Event) {
    this.searchNetworkQuery.set((event.target as HTMLInputElement).value);
  }

  onFiberSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.fiberSearchQuery.set(value);
  }

  onElementTypeChange(type: 'network' | 'fiber') {
    this.selectedElementType.set(type);
    if (type === 'network') {
      this.searchFiberModalQuery.set('');
    } else {
      this.searchNetworkQuery.set('');
    }
  }

  onUserSearchChange(event: Event) {
    this.searchUserQuery.set((event.target as HTMLInputElement).value);
  }

  onClosureNetworkSearchChange(event: Event) {
    this.closureNetworkSearchQuery.set(
      (event.target as HTMLInputElement).value
    );
  }

  // Utilidades de formulario
  private markFormGroupTouched() {
    Object.keys(this.progressForm.controls).forEach((key) => {
      this.progressForm.get(key)?.markAsTouched();
    });
  }

  private markFormGroupTouchedClosure(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  private createFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  // Alertas y notificaciones
  private showSuccessAlert(message: string) {
    Swal.fire({
      title: '✅ Éxito',
      text: message,
      icon: 'success',
      showConfirmButton: false,
      timer: 1500,
    });
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      title: '❌ Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }

  private showWarningAlert(message: string) {
    Swal.fire({
      title: 'Advertencia',
      text: message,
      icon: 'warning',
      confirmButtonText: 'Aceptar',
    });
  }

  private showInfoAlert(title: string, text: string, timer?: number) {
    Swal.fire({ title, text, icon: 'info', showConfirmButton: false, timer });
  }

  private handleError(context: string, error: any) {
    let errorMessage = context;
    if (error.error?.message) {
      errorMessage = Array.isArray(error.error.message)
        ? error.error.message.join(', ')
        : error.error.message;
    }
    this.showErrorAlert(errorMessage);
  }

  // Métodos de navegación y utilidades UI
  goBack() {
    this.location.back();
  }

  openImage(imageName: string) {
    const imageUrl = `${baseUrl}/files/ticket/${imageName}`;
    window.open(imageUrl, '_blank');
  }

  // openImage2(imageName: string) {
  //   const imageUrl = `${baseUrl}/files/ticket/${imageName}`;
  //   window.open(imageUrl, '_blank');
  // }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';

    const parent = imgElement.parentElement;
    if (parent) {
      const placeholder = document.createElement('div');
      placeholder.className =
        'w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center';
      placeholder.innerHTML = `
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      `;
      parent.appendChild(placeholder);
    }
  }

  getImageUrl(item: any): string {
    if (typeof item === 'string') return item;
    return item?.url || item?.secureUrl || item?.imageUrl || item?.path || item;
  }

  // formatVenezuelaTime(
  //   dateString: string | Date | undefined | null,
  //   format: string = 'h:mm a'
  // ): string {
  //   if (!dateString) return 'Fecha no disponible';

  //   const date = dateString instanceof Date ? dateString : new Date(dateString);
  //   if (isNaN(date.getTime())) return 'Fecha inválida';

  //   const localDate = date;

  //   if (format === 'dd/MM/yyyy h:mm a') {
  //     const day = localDate.getDate().toString().padStart(2, '0');
  //     const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
  //     const year = localDate.getFullYear();

  //     let hours = localDate.getHours();
  //     const minutes = localDate.getMinutes().toString().padStart(2, '0');
  //     const ampm = hours >= 12 ? 'PM' : 'AM';

  //     hours = hours % 12;
  //     hours = hours ? hours : 12;

  //     return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  //   }

  //   const datePipe = new DatePipe('en-US');
  //   return datePipe.transform(localDate, format) || 'Formato inválido';
  // }

  formatVenezuelaTime(
    dateString: string | Date | undefined | null,
    format: string = 'h:mm a'
  ): string {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';

      // Ajustar a zona horaria de Venezuela (UTC-4)
      const venezuelaOffset = -4 * 60; // -4 horas en minutos
      const localTime = new Date(date.getTime() + venezuelaOffset * 60 * 1000);

      // Para debugging (puedes eliminar esto después)
      // console.log('Original:', date, 'Venezuela:', localTime);

      if (format === 'dd/MM/yyyy, h:mm a') {
        const day = localTime.getDate().toString().padStart(2, '0');
        const month = (localTime.getMonth() + 1).toString().padStart(2, '0');
        const year = localTime.getFullYear();

        let hours = localTime.getHours();
        const minutes = localTime.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
      }

      // Para otros formatos, usar DatePipe con la fecha ajustada
      const datePipe = new DatePipe('en-US');
      return datePipe.transform(localTime, format) || 'Formato inválido';
    } catch (error) {
      // console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }

  calcularTiempoResolucion(
    fechaInicio: Date | string,
    fechaFin: Date | string
  ): string {
    if (!fechaInicio || !fechaFin) return 'No disponible';

    try {
      const inicio =
        fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
      const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return 'Fechas inválidas';
      }

      const diffMs = fin.getTime() - inicio.getTime();
      if (diffMs < 0) return 'Fechas inconsistentes';

      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHoras > 24) {
        const diffDias = Math.floor(diffHoras / 24);
        const horasRestantes = diffHoras % 24;
        return `${diffDias}d ${horasRestantes}h ${diffMinutos}m`;
      } else if (diffHoras > 0) {
        return `${diffHoras}h ${diffMinutos}m`;
      } else {
        return `${diffMinutos}m`;
      }
    } catch (error) {
      return 'Error en cálculo';
    }
  }

  openFiberElementModal() {
    this.showFiberElementModal.set(true);
  }

  closeFiberElementModal() {
    this.showFiberElementModal.set(false);
    this.searchFiberClosureQuery.set(''); // Limpiar búsqueda del modal de cierre
  }

  selectClosureFiberElement(fiber: any) {
    const completeFiber =
      this.fiberLengthsResource
        .value()
        ?.fiberLengths?.find((f) => f.id === fiber.id) || fiber;

    this.selectedClosureElementType.set('fiber');
    this.selectedClosureFiberElement.set(completeFiber);
    this.selectedClosureNetworkElementsClosure.set([]); // Limpiar elementos de red
    this.closureForm.patchValue({
      fiberLengthId: completeFiber.id,
      networkElementClosureIds: [],
      networkElementIds: this.selectedClosureNetworkElements().map(
        (el) => el.id
      ),
    });
    this.closeFiberElementModal();
  }

  // desde aqui

  // Métodos para manejar elementos de red
  addNetworkElement(element: any) {
    if (!this.isNetworkElementSelected(element)) {
      this.selectedNetworkElements.update((elements) => [...elements, element]);
      this.updateFormWithSelectedElements(); // ✅ AGREGAR
    }
  }

  removeNetworkElement(element: any) {
    this.selectedNetworkElements.update((elements) =>
      elements.filter((e) => e.id !== element.id)
    );
    this.updateFormWithSelectedElements(); // ✅ AGREGAR
  }

  isNetworkElementSelected(element: any): boolean {
    return this.selectedNetworkElements().some((e) => e.id === element.id);
  }

  // Método para seleccionar tramo de fibra (solo uno)
  // selectFiberLength(fiber: any) {
  //   this.selectedFiberElement.set(fiber);
  //   this.selectedNetworkElements.set([]); // Limpiar elementos de red
  // }

  // Método para limpiar selección de fibra
  clearFiberSelection() {
    this.selectedFiberElement.set(null);
  }

  // Método para obtener fiber length completo con estados
  getCompleteFiberLength(fiberLengthId: number): any {
    if (!fiberLengthId) return null;

    const allFibers = this.fiberLengthsResource.value()?.fiberLengths || [];
    const completeFiber = allFibers.find((fiber) => fiber.id === fiberLengthId);

    return completeFiber || null;
  }

  // Método para usar en el HTML (versión segura)
  getFiberDisplayInfo(progress: any): {
    section_name: string;
    stateA: string;
    stateB: string;
  } {
    if (!progress.fiberLengthId)
      return { section_name: 'N/A', stateA: 'N/A', stateB: 'N/A' };

    const completeFiber = this.getCompleteFiberLength(progress.fiberLengthId);

    if (!completeFiber) {
      return {
        section_name:
          progress.fiberLength?.section_name || 'Tramo no encontrado',
        stateA: 'N/A',
        stateB: 'N/A',
      };
    }

    return {
      section_name: completeFiber.section_name || 'Sin nombre',
      stateA: completeFiber.stateA?.state || 'N/A',
      stateB: completeFiber.stateB?.state || 'N/A',
    };
  }

  getLastProgressElement(): any {
    if (!this.hasProgressTickets) return null;

    // El primer elemento del array es el más reciente (orden descendente)
    const lastProgress = this.progressTickets[0];

    if (lastProgress.network_elements?.length) {
      return {
        type: 'network',
        element: lastProgress.network_elements[0], // Solo mostramos el primero para visualización
        allElements: lastProgress.network_elements, // Guardamos todos para referencia
      };
    } else if (lastProgress.fiberLengthId && lastProgress.fiberLength) {
      return {
        type: 'fiber',
        element: lastProgress.fiberLength,
      };
    }

    return null;
  }

  getLastProgressElementDisplay(): string {
    const lastElement = this.getLastProgressElement();

    if (!lastElement) return 'No hay elemento de la última documentación';

    if (lastElement.type === 'network') {
      const element = lastElement.element;
      return `RED: ${element.acronym} - ${element.description} - ${element.central?.central_name}`;
    } else if (lastElement.type === 'fiber') {
      const fiber = lastElement.element;
      return `FIBRA: ${fiber.section_name}`;
    }

    return 'Elemento no reconocido';
  }

  private getLastProgressNetworkElements(): any[] {
    if (!this.hasProgressTickets) return [];

    // Buscar en todas las documentaciones (de más reciente a más antigua)
    for (let i = 0; i < this.progressTickets.length; i++) {
      const progress = this.progressTickets[i];

      if (progress.network_elements && progress.network_elements.length > 0) {
        return progress.network_elements;
      }
    }

    return [];
  }

  private prefillClosureElements() {
    if (this.ticketResource.hasValue()) {
      const ticket = this.ticketResource.value();

      // Obtener elementos de la última documentación
      const lastProgressElements = this.getLastProgressNetworkElements();

      if (lastProgressElements.length > 0) {
        // Tiene elementos de red - establecer tipo y elementos
        this.selectedClosureElementType.set('network');
        this.selectedClosureNetworkElements.set([...lastProgressElements]);
        this.selectedClosureNetworkElementsClosure.set([
          ...lastProgressElements,
        ]);

        // Actualizar formulario con arrays
        this.closureForm.patchValue({
          networkElementIds: lastProgressElements.map((el) => el.id),
          networkElementClosureIds: lastProgressElements.map((el) => el.id),
          fiberLengthId: null,
        });
      } else if (ticket.fiberLengthId && ticket.fiber_length) {
        // Tiene tramo de fibra
        const completeFiber =
          this.fiberLengthsResource
            .value()
            ?.fiberLengths?.find((f) => f.id === ticket.fiberLengthId) ||
          ticket.fiber_length;

        this.selectedClosureElementType.set('fiber');
        this.selectedClosureFiberElement.set(completeFiber);
        this.closureForm.patchValue({
          fiberLengthId: ticket.fiberLengthId,
          networkElementIds: null,
          networkElementClosureIds: null,
        });
      } else {
        // No tiene elementos - usar elementos del ticket inicial si existen
        if (ticket.network_elements?.length) {
          this.selectedClosureElementType.set('network');
          this.selectedClosureNetworkElements.set([...ticket.network_elements]);
          this.selectedClosureNetworkElementsClosure.set([
            ...ticket.network_elements,
          ]);

          this.closureForm.patchValue({
            networkElementIds: ticket.network_elements.map((el) => el.id),
            networkElementClosureIds: ticket.network_elements.map(
              (el) => el.id
            ),
            fiberLengthId: null,
          });
        }
      }
    }
  }

  addClosureNetworkElement(element: any) {
    if (!this.isClosureNetworkElementSelected(element)) {
      this.selectedClosureNetworkElementsClosure.update((elements) => [
        ...elements,
        element,
      ]);
      this.updateClosureFormWithSelectedElements();
    }
  }

  removeClosureNetworkElement(element: any) {
    this.selectedClosureNetworkElementsClosure.update((elements) =>
      elements.filter((e) => e.id !== element.id)
    );
    this.updateClosureFormWithSelectedElements();
  }

  isClosureNetworkElementSelected(element: any): boolean {
    return this.selectedClosureNetworkElementsClosure().some(
      (e) => e.id === element.id
    );
  }

  private updateClosureFormWithSelectedElements() {
    const networkIds = this.selectedClosureNetworkElementsClosure().map(
      (el) => el.id
    );

    this.closureForm.patchValue({
      networkElementClosureIds: networkIds,
      networkElementIds: this.selectedClosureNetworkElements().map(
        (el) => el.id
      ), // Mantener los de solo lectura
    });
  }

generateTicketHistoryPdf() {
  this.isGeneratingPdf.set(true);

  this.ticketsService.generateTicketHistoryPdf(this.ticketId).subscribe({
    next: (blob: Blob) => {
      // 🔥 1. Crear dos URLs de blob diferentes (una para vista, otra para descarga)
      const viewBlobUrl = URL.createObjectURL(blob);
      const downloadBlobUrl = URL.createObjectURL(blob);

      // 🔥 2. Primero: Abrir para visualización (ventana que permanece)
      const pdfWindow = window.open(viewBlobUrl, '_blank');

      // 🔥 3. Configurar mejor la ventana del PDF
      if (pdfWindow) {
        // Intentar darle un título descriptivo
        try {
          setTimeout(() => {
            pdfWindow.document.title = `Historial Ticket ${this.ticketId}`;
          }, 500);
        } catch (e) {
          // Ignorar errores de seguridad
        }
      }

      // 🔥 4. Segundo: Iniciar descarga automática (pero discreta)
      setTimeout(() => {
        this.triggerSilentDownload(downloadBlobUrl, `historial-ticket-${this.ticketId}.pdf`);
      }, 1000); // Esperar 1 segundo para que cargue la vista

      // 🔥 5. Mostrar notificación informativa
      this.showInfoAlert(
        'PDF generado correctamente',
        'El PDF se ha abierto en una nueva pestaña y se está descargando automáticamente.',
        3000
      );

      // 🔥 6. Limpiar URLs después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(viewBlobUrl);
        URL.revokeObjectURL(downloadBlobUrl);
      }, 30000); // 30 segundos

      this.isGeneratingPdf.set(false);
    },
    error: (error) => {
      console.error('Error generating PDF:', error);
      this.isGeneratingPdf.set(false);
      this.showErrorAlert('Error al generar el PDF');
    }
  });
}

// 🔥 Método para descarga silenciosa (sin abrir nueva ventana)
private triggerSilentDownload(blobUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

  // generateTicketHistoryPdf() {
  //   this.isGeneratingPdf.set(true);

  //   this.ticketsService.generateTicketHistoryPdf(this.ticketId).subscribe({
  //     next: (blob: Blob) => {
  //       // Crear URL y abrir en nueva pestaña
  //       const url = window.URL.createObjectURL(blob);
  //       const newWindow = window.open(url, '_blank');

  //       if (!newWindow) {
  //         this.showWarningAlert(
  //           'Por favor permite ventanas emergentes para ver el PDF'
  //         );
  //       }

  //       // Limpiar URL después de un tiempo
  //       setTimeout(() => {
  //         window.URL.revokeObjectURL(url);
  //       }, 5000);

  //       this.isGeneratingPdf.set(false);
  //     },
  //     error: (error) => {
  //       console.error('Error generating PDF:', error);
  //       this.isGeneratingPdf.set(false);
  //       this.showErrorAlert(
  //         'Error al generar el historial en PDF. Por favor intenta nuevamente.'
  //       );
  //     },
  //   });
  // }
}
