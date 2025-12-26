import {
  CommonModule,
  DatePipe,
  Location,
} from '@angular/common';
import { Component, inject, signal, effect, computed, OnDestroy } from '@angular/core';
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
import { IncidentsService } from '@features/incidents/services/incidents.service';
import { IncidentsDetailsService } from '@features/incidents-details/services/incidents-details.service';
import { TicketImagePipe } from '@app-front/pipes/ticket-image.pipe';
import { environment } from 'src/environments/environment';
import { StatesService } from '@features/states/services/states.service';
import { GroupsEscalatoryService } from '@features/group-escalatory/services/groups-escalatory.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ProgressPaginationComponent } from '@shared/components/progress-pagination/progress-pagination.component';

const baseUrl = environment.baseUrl;

@Component({
  selector: 'app-ticket-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    CommonModule,
    TicketImagePipe,
    ProgressPaginationComponent,
  ],
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
export class TicketPageComponent implements OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private ticketsService = inject(TicketsService);
  private progressTicketService = inject(ProgressTicketService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private location = inject(Location);

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
  private statesService = inject(StatesService);
  private groupsEscalatoryService = inject(GroupsEscalatoryService);

  ticketId = +this.activatedRoute.snapshot.params['id'];
  showModal = signal(false);
  isSubmitting = signal(false);
  isSubmittingClosure = signal(false);
  selectedFiles = signal<File[]>([]);
  selectedElementType = signal<'network' | 'fiber'>('network');
  showNetworkElementModal = signal(false);
  selectedClosureElementType = signal<'network' | 'fiber' | null>(null);
  selectedClosureFiberElement = signal<any>(null);
  showFiberElementModal = signal(false);
  fiberSearchQuery = signal('');
  showDateTimeAlert = signal(false);
  dateTimeAlertMessage = signal('');
  private alertTimeout: any = null;

  searchNetworkQuery = signal('');
  searchFiberQuery = signal('');
  searchUserQuery = signal('');
  closureNetworkSearchQuery = signal('');
  allNetworkElements = signal<any[]>([]);
  allFiberLengths = signal<FiberLength[]>([]);
  allUsers = signal<any[]>([]);
  filteredPlatforms = signal<any[]>([]);
  filteredFailures = signal<any[]>([]);

  selectedNetworkElements = signal<any[]>([]);
  selectedFiberElement = signal<any>(null);

  searchFiberModalQuery = signal('');
  searchFiberClosureQuery = signal('');

  selectedClosureNetworkElements = signal<any[]>([]);
  selectedClosureNetworkElementsClosure = signal<any[]>([]);

  isGeneratingPdf = signal(false);
  currentPage = signal(1);

  showPersonalsModal = signal(false);
  selectedPersonal = signal<any>(null);
  personalsSearch = signal('');
  private personalSearchSubject = new Subject<string>();
  personalCurrentPage = signal(1);
  personalItemsPerPage = 10;
  personalTotalPages = signal(0);
  allPersonals = signal<any[]>([]);
  personalSearchMode = signal<'all' | 'filtered'>('all');
  selectedStateId = signal<number | null>(null);
  selectedGroupId = signal<number | null>(null);
  nameSearch = signal('');
  surnameSearch = signal('');

  statesList: any[] = [];
  groupsList: any[] = [];

  imageUrl = computed(() => {
    return `${baseUrl}/files/ticket/${
      this.ticketResource.value()?.images?.[0]
    }`;
  });

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
    networkElementIds: this.fb.control<number[]>([]),
    networkElementClosureIds: this.fb.control<number[]>([]),
    fiberLengthId: [null as number | null],
    incidentId: [null as number | null, Validators.required],
    incidentDetailId: [null as number | null, Validators.required],
  });

  ticketResource = rxResource({
    params: () => ({ id: this.ticketId }),
    stream: ({ params }) => this.ticketsService.getTicketById(params.id),
  });

  progressTicketsResource = rxResource({
    params: () => ({
      ticketId: this.ticketId,
      page: this.currentPage(),
      limit: 3,
    }),
    stream: ({ params }) =>
      this.progressTicketService.getProgressTicketsByTicketId(
        params.ticketId,
        { page: params.page, limit: params.limit }
      ),
  });

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

  changeProgressPage(page: number): void {
    this.currentPage.set(page);
    this.progressTicketsResource.reload();
  }

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

    this.progressForm.get('groupId')?.valueChanges.subscribe((groupId) => {
      this.onGroupChangeInProgressForm(groupId);
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

    this.setupPersonalSearchDebouncing();
    this.loadFilterOptions();
  }

  ngOnDestroy() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  onGroupChangeInProgressForm(groupId: number | null): void {
    if (!groupId || groupId === 0) {
      const allPlatforms = this.platformsResource.value() || [];
      this.filteredPlatforms.set(allPlatforms);

      const allFailures = this.failuresResource.value() || [];
      this.filteredFailures.set(allFailures);

      this.progressForm.patchValue({
        platformId: null,
        failureId: null,
      });
      return;
    }

    this.filterPlatformsByGroup(groupId);
    this.loadFailuresByGroup(groupId);

    this.progressForm.patchValue({
      platformId: null,
      failureId: null,
    });
  }

  private loadFailuresByGroup(groupId: number): void {
    this.groupsService.getFailuresByGroup(groupId).subscribe({
      next: (failures) => {
        this.filteredFailures.set(failures || []);

        const currentFailureId = this.progressForm.get('failureId')?.value;
        if (currentFailureId && currentFailureId !== 0) {
          const currentFailureValid = failures?.some(
            (failure: any) => failure.id === currentFailureId
          );
          if (!currentFailureValid) {
            this.progressForm.patchValue({ failureId: null });
          }
        }
      },
      error: (error) => {
        console.error('Error loading failures for group:', error);
        this.filteredFailures.set([]);
        this.progressForm.patchValue({ failureId: null });
      },
    });
  }

  private setupPersonalSearchDebouncing(): void {
    this.personalSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.personalsSearch.set(searchTerm);
        this.personalCurrentPage.set(1);

        if (searchTerm.length === 0) {
          this.personalSearchMode.set('all');
          this.loadPersonals();
        } else {
          this.personalSearchMode.set('filtered');
          this.searchPersonals();
        }
      });
  }

  private loadFilterOptions(): void {
    this.statesService.getStates().subscribe({
      next: (states) => (this.statesList = states),
      error: (err) => console.error('Error loading states', err),
    });

    this.groupsEscalatoryService.getGroupsEscalatory().subscribe({
      next: (groups) => (this.groupsList = groups),
      error: (err) => console.error('Error loading groups', err),
    });
  }

  private showDateTimeError(message: string): void {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    this.dateTimeAlertMessage.set(message);
    this.showDateTimeAlert.set(true);

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

    if (!dateHllsValue || !dateHirValue || !dateHrsValue || !dateHffValue) {
      this.showDateTimeError('Todos los campos de fecha/hora son requeridos');
      return false;
    }

    const dateHct = new Date(ticket.date_hct);
    const dateHlls = new Date(dateHllsValue);
    const dateHir = new Date(dateHirValue);
    const dateHrs = new Date(dateHrsValue);
    const dateHff = new Date(dateHffValue);

    if (dateHlls && dateHlls < dateHct) {
      this.showDateTimeError(
        'La hora de llegada al sitio no puede ser anterior a la hora de contacto técnico'
      );
      return false;
    }

    if (dateHir && dateHlls && dateHir < dateHlls) {
      this.showDateTimeError(
        'La hora de inicio de reparación no puede ser anterior a la hora de llegada al sitio'
      );
      return false;
    }

    if (dateHrs && dateHir && dateHrs < dateHir) {
      this.showDateTimeError(
        'La hora de restablecimiento de servicio no puede ser anterior a la hora de inicio de reparación'
      );
      return false;
    }

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

  get progressTickets(): ProgressTicket[] {
    const response = this.progressTicketsResource.value();
    const tickets = response?.data || [];

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
    return this.progressTicketsResource.value()?.count || 0;
  }

  get progressTicketsPages(): number {
    return this.progressTicketsResource.value()?.pages || 0;
  }

  get hasProgressTickets(): boolean {
    const response = this.progressTicketsResource.value();
    return (response?.data?.length || 0) > 0;
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

  canCreateNewProgress(): boolean {
    const ticket = this.ticketResource.value();
    return !!ticket && !ticket?.closure && ticket?.statusId !== 2;
  }

  openModal() {
    this.showModal.set(true);
    this.loadAllData();

    setTimeout(() => {
      this.prefillFormWithTicketData();

      if (this.hasProgressTickets) {
        this.prefillElementsFromLastProgress();
      } else {
        this.prefillElementsFromTicket();
      }

      const groupId = this.progressForm.get('groupId')?.value;
      this.filterPlatformsByGroup(groupId || null);
    }, 100);
  }

  private prefillElementsFromLastProgress() {
    const lastProgressElements = this.getLastProgressNetworkElements();
    const lastFiberElement = this.getLastProgressFiberElement();

    if (lastProgressElements.length > 0) {
      this.selectedNetworkElements.set([...lastProgressElements]);
      this.selectedElementType.set('network');
    } else if (lastFiberElement) {
      this.selectedFiberElement.set(lastFiberElement);
      this.selectedElementType.set('fiber');
    } else {
      this.prefillElementsFromTicket();
    }

    this.updateFormWithSelectedElements();
  }

  private prefillElementsFromTicket() {
    const ticket = this.ticketResource.value();
    const lastProgressElements = this.getLastProgressNetworkElements();
    const lastFiberElement = this.getLastProgressFiberElement();

    if (lastProgressElements.length > 0) {
      this.selectedNetworkElements.set([...lastProgressElements]);
      this.selectedElementType.set('network');
    } else if (lastFiberElement) {
      this.selectedFiberElement.set(lastFiberElement);
      this.selectedElementType.set('fiber');
    }
    else if (ticket?.network_elements?.length) {
      this.selectedNetworkElements.set([...ticket.network_elements]);
      this.selectedElementType.set('network');
    } else if (ticket?.fiberLengthId && ticket.fiber_length) {
      this.selectedFiberElement.set(ticket.fiber_length);
      this.selectedElementType.set('fiber');
    }

    this.updateFormWithSelectedElements();
  }

  private getLastProgressFiberElement(): any {
    if (!this.hasProgressTickets) return null;

    for (let i = 0; i < this.progressTickets.length; i++) {
      const progress = this.progressTickets[i];

      if (progress.fiberLengthId && progress.fiberLength) {
        return progress.fiberLength;
      }

      if (progress.fiberLengthId && !progress.fiberLength) {
        const fiber = this.fiberLengthsResource
          .value()
          ?.fiberLengths?.find((f) => f.id === progress.fiberLengthId);
        if (fiber) return fiber;
      }
    }

    return null;
  }

  private updateFormWithSelectedElements() {
    const networkIds = this.selectedNetworkElements().map((el) => el.id);
    const fiberId = this.selectedFiberElement()?.id || null;

    this.progressForm.patchValue({
      elementNetworkId: networkIds,
      fiberLengthId: fiberId,
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFiles.set([]);
    this.selectedNetworkElements.set([]);
    this.selectedFiberElement.set(null);
    this.selectedElementType.set('network');
    this.searchFiberModalQuery.set('');
    this.searchNetworkQuery.set('');
    this.selectedPersonal.set(null);
    this.filteredPlatforms.set([]);
    this.filteredFailures.set([]);
    this.closePersonalsModal();

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
            this.currentPage.set(1);
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
        networkElementIds: formValue.networkElementIds || [],
        networkElementClosureIds: formValue.networkElementClosureIds || [],
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
      inputPlaceholder: 'Describa el motivo de cancelación...',
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
      cancelledById: user.id,
      cancelledAt: new Date().toISOString(),
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

  selectNetworkElement(element: any) {
    this.selectedElementType.set('network');
    this.progressForm.patchValue({
      elementNetworkId: [element.id],
      fiberLengthId: null,
    });
  }

  selectFiberLength(fiber: any) {
    this.selectedFiberElement.set(fiber);
    this.selectedNetworkElements.set([]);
    this.selectedElementType.set('fiber');
    this.updateFormWithSelectedElements();
  }

  selectUser(user: any) {
    this.progressForm.patchValue({ assignedUserId: user.id });
    this.searchUserQuery.set('');
  }

  openNetworkElementModal() {
    this.showNetworkElementModal.set(true);
  }

  closeNetworkElementModal() {
    this.showNetworkElementModal.set(false);
    this.closureNetworkSearchQuery.set('');
  }

  selectClosureNetworkElement(element: any) {
    this.addClosureNetworkElement(element);
  }

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

      if (ticket.personalRegionId && ticket.personal_region) {
        const allPersonals =
          this.personalsRegionResource.value()?.personalsRegions || [];
        const foundPersonal = allPersonals.find(
          (p) => p.id === ticket.personalRegionId
        );
        if (foundPersonal) {
          this.selectedPersonal.set(foundPersonal);
        }
      }

      this.filterPlatformsByGroup(ticket.groupId || null);

      if (ticket.groupId) {
        this.loadFailuresByGroup(ticket.groupId);
      }
    }
  }

  private filterPlatformsByGroup(groupId: number | null): void {
    if (!groupId || groupId === 0) {
      const allPlatforms = this.platformsResource.value() || [];
      this.filteredPlatforms.set(allPlatforms);
      return;
    }

    const allPlatforms = this.platformsResource.value() || [];
    const platformsForGroup = allPlatforms.filter((platform) =>
      platform.groups?.some((group: any) => group.id === groupId)
    );

    this.filteredPlatforms.set(platformsForGroup);
  }

  private prefillClosureForm() {
    if (this.ticketResource.hasValue()) {
      const ticket = this.ticketResource.value();
      this.closureForm.patchValue({ groupId: ticket.groupId || null });
      this.prefillClosureElements();
    }
  }

  addNetworkElement(element: any) {
    if (!this.isNetworkElementSelected(element)) {
      this.selectedNetworkElements.update((elements) => [...elements, element]);
      this.updateFormWithSelectedElements();
    }
  }

  removeNetworkElement(element: any) {
    this.selectedNetworkElements.update((elements) =>
      elements.filter((e) => e.id !== element.id)
    );
    this.updateFormWithSelectedElements();
  }

  isNetworkElementSelected(element: any): boolean {
    return this.selectedNetworkElements().some((e) => e.id === element.id);
  }

  clearFiberSelection() {
    this.selectedFiberElement.set(null);
  }

  getCompleteFiberLength(fiberLengthId: number): any {
    if (!fiberLengthId) return null;

    const allFibers = this.fiberLengthsResource.value()?.fiberLengths || [];
    const completeFiber = allFibers.find((fiber) => fiber.id === fiberLengthId);

    return completeFiber || null;
  }

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

    const lastProgress = this.progressTickets[0];

    if (lastProgress.network_elements?.length) {
      return {
        type: 'network',
        element: lastProgress.network_elements[0],
        allElements: lastProgress.network_elements,
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

      const lastProgressElements = this.getLastProgressNetworkElements();
      const lastProgressFiberElement = this.getLastProgressFiberElement();

      if (lastProgressElements.length > 0) {
        this.selectedClosureElementType.set('network');
        this.selectedClosureNetworkElements.set([...lastProgressElements]);
        this.selectedClosureNetworkElementsClosure.set([
          ...lastProgressElements,
        ]);

        this.closureForm.patchValue({
          networkElementIds: lastProgressElements.map((el) => el.id),
          networkElementClosureIds: lastProgressElements.map((el) => el.id),
          fiberLengthId: null,
        });
      } else if (lastProgressFiberElement) {
        const completeFiber =
          this.fiberLengthsResource
            .value()
            ?.fiberLengths?.find((f) => f.id === lastProgressFiberElement.id) ||
          lastProgressFiberElement;

        this.selectedClosureElementType.set('fiber');
        this.selectedClosureFiberElement.set(completeFiber);
        this.closureForm.patchValue({
          fiberLengthId: completeFiber.id,
          networkElementIds: null,
          networkElementClosureIds: null,
        });
      } else {
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
        } else if (ticket.fiberLengthId && ticket.fiber_length) {
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
      ),
    });
  }

  generateTicketHistoryPdf() {
    this.isGeneratingPdf.set(true);

    this.ticketsService.generateTicketHistoryPdf(this.ticketId).subscribe({
      next: (blob: Blob) => {
        const viewBlobUrl = URL.createObjectURL(blob);
        const downloadBlobUrl = URL.createObjectURL(blob);

        const pdfWindow = window.open(viewBlobUrl, '_blank');

        if (pdfWindow) {
          try {
            setTimeout(() => {
              pdfWindow.document.title = `Historial Ticket ${this.ticketId}`;
            }, 500);
          } catch (e) {}
        }

        setTimeout(() => {
          this.triggerSilentDownload(
            downloadBlobUrl,
            `historial-ticket-${this.ticketId}.pdf`
          );
        }, 1000);

        this.showInfoAlert(
          'PDF generado correctamente',
          'El PDF se ha abierto en una nueva pestaña y se está descargando automáticamente.',
          3000
        );

        setTimeout(() => {
          URL.revokeObjectURL(viewBlobUrl);
          URL.revokeObjectURL(downloadBlobUrl);
        }, 30000);

        this.isGeneratingPdf.set(false);
      },
      error: (error) => {
        console.error('Error generating PDF:', error);
        this.isGeneratingPdf.set(false);
        this.showErrorAlert('Error al generar el PDF');
      },
    });
  }

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

  goBack() {
    this.location.back();
  }

  openImage(imageName: string) {
    const imageUrl = `${baseUrl}/files/ticket/${imageName}`;
    window.open(imageUrl, '_blank');
  }

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

  formatVenezuelaTime(
    dateString: string | Date | undefined | null,
    format: string = 'h:mm a'
  ): string {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';

      const venezuelaOffset = -4 * 60;
      const localTime = new Date(date.getTime() + venezuelaOffset * 60 * 1000);

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

      const datePipe = new DatePipe('en-US');
      return datePipe.transform(localTime, format) || 'Formato inválido';
    } catch (error) {
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
    this.searchFiberClosureQuery.set('');
  }

  selectClosureFiberElement(fiber: any) {
    const completeFiber =
      this.fiberLengthsResource
        .value()
        ?.fiberLengths?.find((f) => f.id === fiber.id) || fiber;

    this.selectedClosureElementType.set('fiber');
    this.selectedClosureFiberElement.set(completeFiber);
    this.selectedClosureNetworkElementsClosure.set([]);
    this.closureForm.patchValue({
      fiberLengthId: completeFiber.id,
      networkElementClosureIds: [],
      networkElementIds: this.selectedClosureNetworkElements().map(
        (el) => el.id
      ),
    });
    this.closeFiberElementModal();
  }

  openPersonalsModal(): void {
    this.showPersonalsModal.set(true);
    this.loadPersonals();
  }

  closePersonalsModal(): void {
    this.showPersonalsModal.set(false);
    this.clearFilters();
  }

  loadPersonals(): void {
    const offset = (this.personalCurrentPage() - 1) * this.personalItemsPerPage;

    this.personalsRegionService
      .getPersonalRegion({
        limit: this.personalItemsPerPage,
        offset: offset,
      })
      .subscribe({
        next: (response: any) => {
          this.allPersonals.set(response.personalsRegions || []);
          this.personalTotalPages.set(
            Math.ceil(response.count / this.personalItemsPerPage)
          );
        },
        error: (err) => {
          console.error('Error loading personals', err);
          this.allPersonals.set([]);
        },
      });
  }

  searchPersonals(): void {
    const searchTerm = this.personalsSearch();
    const stateId = this.selectedStateId();
    const groupId = this.selectedGroupId();
    const name = this.nameSearch();
    const surname = this.surnameSearch();

    const stateIdParam = stateId !== null ? stateId : undefined;
    const groupIdParam = groupId !== null ? groupId : undefined;
    const nameParam = name !== '' ? name : undefined;
    const surnameParam = surname !== '' ? surname : undefined;

    if (!searchTerm && !stateId && !groupId && !name && !surname) {
      this.personalSearchMode.set('all');
      this.loadPersonals();
      return;
    }

    this.personalsRegionService
      .getPersonalRegionByAdvanced(
        searchTerm !== '' ? searchTerm : undefined,
        stateIdParam,
        groupIdParam,
        nameParam,
        surnameParam
      )
      .subscribe({
        next: (personals: any[]) => {
          this.allPersonals.set(personals);
          this.personalTotalPages.set(1);
        },
        error: (err) => {
          console.error('Error searching personals', err);
          this.allPersonals.set([]);
          this.personalTotalPages.set(1);
        },
      });
  }

  clearFilters(): void {
    this.selectedStateId.set(null);
    this.selectedGroupId.set(null);
    this.nameSearch.set('');
    this.surnameSearch.set('');
    this.personalsSearch.set('');
    this.personalSearchMode.set('all');
    this.loadPersonals();
  }

  onPersonalSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.personalsSearch.set(value);
    this.onFilterChange();
  }

  onFilterChange(): void {
    this.personalCurrentPage.set(1);
    this.personalSearchMode.set('filtered');
    this.searchPersonals();
  }

  selectPersonal(personal: any): void {
    this.selectedPersonal.set(personal);
  }

  isPersonalSelected(personal: any): boolean {
    return this.selectedPersonal()?.id === personal.id;
  }

  savePersonalSelection(): void {
    const selectedPersonal = this.selectedPersonal();
    if (selectedPersonal) {
      this.progressForm.patchValue({
        personalRegionId: selectedPersonal.id,
      });
    }
    this.closePersonalsModal();
  }

  getSelectedPersonalText(): string {
    const selected = this.selectedPersonal();
    if (!selected) {
      return 'Seleccione un responsable';
    }

    const groups =
      selected.groups_escalatory
        ?.map((g: any) => g.group_escalatory)
        .join(', ') || 'Sin grupo';
    const states =
      selected.states?.map((s: any) => s.state).join(', ') || 'Sin estado';
    const position = selected.position?.[0]?.position || 'Sin cargo';

    return `${selected.names} ${selected.surnames} - ${groups} - ${states} - ${position}`;
  }

  getPersonalPaginationRange(): (number | string)[] {
    const current = this.personalCurrentPage();
    const total = this.personalTotalPages();
    const delta = 2;
    const range = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        range.push(i);
      }
      return range;
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift('...');
    }
    if (current + delta < total - 1) {
      range.push('...');
    }

    range.unshift(1);
    range.push(total);

    return range;
  }

  goToPersonalPage(page: number | string): void {
    if (
      this.personalSearchMode() === 'all' &&
      typeof page === 'number' &&
      page >= 1 &&
      page <= this.personalTotalPages()
    ) {
      this.changePersonalPage(page);
    }
  }

  changePersonalPage(page: number): void {
    if (page >= 1 && page <= this.personalTotalPages()) {
      this.personalCurrentPage.set(page);
      this.loadPersonals();
    }
  }

  getDocumentNumber(indexInPage: number): number {
    const currentPage = this.currentPage();
    const itemsPerPage = 3;

    return (
      this.progressTicketsCount -
      ((currentPage - 1) * itemsPerPage + indexInPage)
    );
  }
}
