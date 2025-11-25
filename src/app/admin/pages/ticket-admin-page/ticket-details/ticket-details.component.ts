import { Component, inject, signal, OnInit, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from 'rxjs';
import Swal from 'sweetalert2';

// Servicios
import { GroupsService } from '@features/groups/services/groups.service';
import { OriginsService } from '@features/origins/services/origins.service';
import { SeveritiesService } from '@features/severities/services/severities.service';
import { FailuresService } from '@features/failures/services/failures.service';
import { PlatformsService } from '@features/platforms/services/platforms.service';
import { StatusesService } from '@features/statuses/services/statuses.service';
import { PersonalRegionService } from '@features/personal-region/services/personal-region.service';
import { NetworkElementsService } from '@features/network-elements/services/network-elements.service';
import { TicketsService } from '@tickets/services/tickets.service';
import { AuthService } from '@auth/services/auth.service';
import { FiberLengthsService } from '@features/fiber-lengths/services/fiber-lengths.service';
import { StatesService } from '@features/states/services/states.service';
import { GroupsEscalatoryService } from '@features/group-escalatory/services/groups-escalatory.service';

// Componentes
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';

// Interfaces
import { Ticket } from '@tickets/interfaces/ticket.interface';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';
import {
  FiberLength,
  FiberLengthsResponse,
} from '@features/fiber-lengths/interfaces/fiber-length.interface';
import {
  PersonalRegion,
  PersonalsRegion,
} from '@features/personal-region/interfaces/personal-region.interface';

@Component({
  selector: 'ticket-details',
  imports: [ReactiveFormsModule, FormErrorLabelComponent, RouterLink],
  templateUrl: './ticket-details.component.html',
})
export class TicketDetailsComponent implements OnInit {
  // Inputs y servicios
  ticket = input.required<Ticket>();
  private fb = inject(FormBuilder);
  private ticketsService = inject(TicketsService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private groupsService = inject(GroupsService);
  private originsService = inject(OriginsService);
  private severitiesService = inject(SeveritiesService);
  private failuresService = inject(FailuresService);
  private platformsService = inject(PlatformsService);
  private statusesService = inject(StatusesService);
  private personalsRegionService = inject(PersonalRegionService);
  private networkElementsService = inject(NetworkElementsService);
  private fiberLengthsService = inject(FiberLengthsService);
  private statesServices = inject(StatesService);
  private groupsEscalatoryServices = inject(GroupsEscalatoryService);

  // Señales y estado
  isLoading = signal(false);
  isError = signal<string | null>(null);
  selectionType = signal<'network' | 'fiber'>('network');
  isSelectionLocked = signal(false);
  readonly FIBER_CUT_FAILURE_ID = 7;

  // Señales para modales y búsquedas
  showNetworkElementsModal = signal(false);
  selectedNetworkElements = signal<NetworkElement[]>([]);
  networkElementsSearch = signal('');
  searchSubject = new Subject<string>();
  currentPage = signal(1);
  itemsPerPage = 9;
  totalPages = signal(0);
  allNetworkElements = signal<NetworkElement[]>([]);
  searchMode = signal<'all' | 'filtered'>('all');

  showFiberLengthsModal = signal(false);
  selectedFiberLength = signal<FiberLength | null>(null);
  fiberLengthsSearch = signal('');
  fiberSearchSubject = new Subject<string>();
  fiberCurrentPage = signal(1);
  fiberItemsPerPage = 9;
  fiberTotalPages = signal(0);
  allFiberLengths = signal<FiberLength[]>([]);
  fiberSearchMode = signal<'all' | 'filtered'>('all');

  showPersonalsModal = signal(false);
  selectedPersonal = signal<PersonalRegion | null>(null);
  personalsSearch = signal('');
  personalSearchSubject = new Subject<string>();
  personalCurrentPage = signal(1);
  personalItemsPerPage = 10;
  personalTotalPages = signal(0);
  allPersonals = signal<PersonalRegion[]>([]);
  personalSearchMode = signal<'all' | 'filtered'>('all');
  selectedStateId = signal<number | null>(null);
  selectedGroupId = signal<number | null>(null);
  nameSearch = signal('');
  surnameSearch = signal('');

  // Señales para campos de reporte telefónico
  showReportingFields = signal(false);
  hasExistingPhoneReport = signal(false);

  filteredPlatforms = signal<any[]>([]);
  private groupChangeSubscription?: Subscription;

  showDateTimeAlert = signal(false);
  dateTimeAlertMessage = signal('');
  private alertTimeout: any = null;

  // Listas para filtros
  statesList: any[] = [];
  groupsList: any[] = [];

  // Formulario
  ticketForm = this.fb.group({
    groupId: [0, Validators.required],
    severityId: [0, Validators.required],
    platformId: [0, Validators.required],
    originId: [0, Validators.required],
    failureId: [0, Validators.required],
    statusId: [0, Validators.required],
    elementNetworkId: this.fb.control<number[]>([]),
    fiberLengthId: this.fb.control<number | null>(null),
    definition_problem: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
      ],
    ],
    evidences_problem: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
      ],
    ],
    hypothesis: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(500)],
    ],
    personalRegionId: this.fb.control<number | null>(null),
    impact: [''],
    date_hif: ['', Validators.required],
    date_hdc: [null as string | null],
    date_hct: [null as string | null],
    personPhoneReport: this.fb.group({
      name: [''],
      phone: [''],
    }),
  });

  // Recursos con rxResource
  groupsResource = rxResource({
    params: () => ({}),
    stream: () => this.groupsService.getGroups(),
  });

  originsResource = rxResource({
    params: () => ({}),
    stream: () => this.originsService.getOrigins(),
  });

  severitiesResource = rxResource({
    params: () => ({}),
    stream: () => this.severitiesService.getSeverities(),
  });

  failuresResource = rxResource({
    params: () => ({}),
    stream: () => this.failuresService.getFailures(),
  });

  platformsResource = rxResource({
    params: () => ({}),
    stream: () => this.platformsService.getPlatforms(),
  });

  statusesResource = rxResource({
    params: () => ({}),
    stream: () => this.statusesService.getStatuses(),
  });

  personalsRegionResource = rxResource({
    params: () => ({}),
    stream: () => this.personalsRegionService.getPersonalRegion({}),
  });

  networkElementsResource = rxResource({
    params: () => ({}),
    stream: () => this.networkElementsService.getNetworkElements({}),
  });

  ngOnInit(): void {
    this.setupSearchDebouncing();
    this.loadFilterOptions();
    this.setFormValue(this.ticket());
    this.setupGroupPlatformDependency();
    this.loadInitialPlatforms();

    this.ticketForm.get('statusId')?.disable();

    // Suscripciones a cambios
    this.ticketForm.get('failureId')?.valueChanges.subscribe((failureId) => {
      this.onFailureChange(failureId);
    });

    this.ticketForm.get('originId')?.valueChanges.subscribe((originId) => {
      this.onOriginChange(originId ?? null);
    });

    // ✅ NUEVO: Suscripciones para validación de fechas
    this.ticketForm.get('date_hdc')?.valueChanges.subscribe(() => {
      this.onDateHdcChange();
    });

    this.ticketForm.get('date_hct')?.valueChanges.subscribe(() => {
      this.onDateHctChange();
    });
  }

  ngOnDestroy(): void {
    this.groupChangeSubscription?.unsubscribe();
  }

  // ========== MÉTODOS PARA REPORTE TELEFÓNICO ==========

  onOriginChange(originId: number | null | undefined): void {
    const TELEPHONE_ORIGIN_ID = 3;
    const actualOriginId = originId ?? null;

    const shouldShowFields =
      actualOriginId === TELEPHONE_ORIGIN_ID || this.hasExistingPhoneReport();
    this.showReportingFields.set(shouldShowFields);

    if (actualOriginId === TELEPHONE_ORIGIN_ID) {
      this.ticketForm.get('personPhoneReport')?.enable();
      this.ticketForm
        .get('personPhoneReport.name')
        ?.setValidators([Validators.required, Validators.minLength(3)]);
      this.ticketForm
        .get('personPhoneReport.phone')
        ?.setValidators([Validators.required, this.phoneValidator]);
    } else {
      this.ticketForm.get('personPhoneReport.name')?.clearValidators();
      this.ticketForm.get('personPhoneReport.phone')?.clearValidators();
      this.ticketForm.get('personPhoneReport')?.enable();
    }

    this.ticketForm.get('personPhoneReport.name')?.updateValueAndValidity();
    this.ticketForm.get('personPhoneReport.phone')?.updateValueAndValidity();
  }

  phoneValidator(control: any) {
    if (!control.value) return null;

    const phone = control.value.trim();
    const phonePattern = /^(02\d{2}-?\d{7}|04(14|24|16|26|12|22)-?\d{7})$/;

    return phonePattern.test(phone) ? null : { invalidPhone: true };
  }

  formatPhone(event: any): void {
    const phoneControl = this.ticketForm.get('personPhoneReport.phone');
    if (!phoneControl) return;

    let phone = event.target.value.replace(/\D/g, '');

    if (phone.length >= 4) {
      phone = phone.substring(0, 4) + '-' + phone.substring(4);
    }

    if (phone.length > 12) {
      phone = phone.substring(0, 12);
    }

    phoneControl.setValue(phone);
  }

  private validateDateTimeFields(): boolean {
    const currentDate = new Date();

    const dateHifValue = this.ticketForm.get('date_hif')?.value;
    const dateHdcValue = this.ticketForm.get('date_hdc')?.value;
    const dateHctValue = this.ticketForm.get('date_hct')?.value;

    const dateHif = dateHifValue ? new Date(dateHifValue) : null;
    const dateHdc = dateHdcValue ? new Date(dateHdcValue) : null;
    const dateHct = dateHctValue ? new Date(dateHctValue) : null;

    // Validación 1: Hora inicio falla no puede ser posterior a la actual
    if (dateHif && dateHif > currentDate) {
      this.showDateTimeError(
        'La hora de inicio de falla no puede ser posterior a la fecha actual'
      );
      return false;
    }

    // Validación 2: Hora diagnóstico COR debe ser mayor a inicio falla
    if (dateHdc && dateHif && dateHdc <= dateHif) {
      this.showDateTimeError(
        'La hora de diagnóstico COR debe ser posterior a la hora de inicio de falla'
      );
      return false;
    }

    // Validación 3: Hora contacto técnico debe ser mayor a diagnóstico COR
    if (dateHct && dateHdc && dateHct <= dateHdc) {
      this.showDateTimeError(
        'La hora de contacto técnico debe ser posterior a la hora de diagnóstico COR'
      );
      return false;
    }

    return true;
  }

  onDateHdcChange(): void {
    const dateHdcValue = this.ticketForm.get('date_hdc')?.value;
    const dateHifValue = this.ticketForm.get('date_hif')?.value;

    if (!dateHdcValue || !dateHifValue) return;

    const selectedDate = new Date(dateHdcValue);
    const inicioFallaDate = new Date(dateHifValue);

    if (selectedDate <= inicioFallaDate) {
      this.showDateTimeError(
        'La hora de diagnóstico COR debe ser posterior al inicio de falla'
      );
      this.ticketForm.patchValue({ date_hdc: '' });
    }
  }

  onDateHctChange(): void {
    const dateHctValue = this.ticketForm.get('date_hct')?.value;
    const dateHdcValue = this.ticketForm.get('date_hdc')?.value;

    if (!dateHctValue || !dateHdcValue) return;

    const selectedDate = new Date(dateHctValue);
    const diagnosticoDate = new Date(dateHdcValue);

    if (selectedDate <= diagnosticoDate) {
      this.showDateTimeError(
        'La hora de contacto técnico debe ser posterior al diagnóstico COR'
      );
      this.ticketForm.patchValue({ date_hct: '' });
    }
  }

  // Métodos auxiliares para validaciones en el template
  isDateHifInvalid(): boolean {
    const dateHifValue = this.ticketForm.get('date_hif')?.value;
    if (!dateHifValue) return false;

    const selectedDate = new Date(dateHifValue);
    const currentDate = new Date();
    return selectedDate > currentDate;
  }

  isDateHdcInvalid(): boolean {
    const dateHdcValue = this.ticketForm.get('date_hdc')?.value;
    const dateHifValue = this.ticketForm.get('date_hif')?.value;

    if (!dateHdcValue || !dateHifValue) return false;

    const selectedDate = new Date(dateHdcValue);
    const inicioFallaDate = new Date(dateHifValue);
    return selectedDate <= inicioFallaDate;
  }

  isDateHctInvalid(): boolean {
    const dateHctValue = this.ticketForm.get('date_hct')?.value;
    const dateHdcValue = this.ticketForm.get('date_hdc')?.value;

    if (!dateHctValue || !dateHdcValue) return false;

    const selectedDate = new Date(dateHctValue);
    const diagnosticoDate = new Date(dateHdcValue);
    return selectedDate <= diagnosticoDate;
  }

  private showDateTimeError(message: string): void {
    // Limpiar timeout anterior si existe
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    this.dateTimeAlertMessage.set(message);
    this.showDateTimeAlert.set(true);

    // Ocultar automáticamente después de 4 segundos
    this.alertTimeout = setTimeout(() => {
      this.showDateTimeAlert.set(false);
    }, 4000);
  }

  private autocompleteWithNetworkElement(): void {
    const selectedElements = this.selectedNetworkElements();

    if (selectedElements.length === 0) {
      this.clearDefinitionProblem();
      return;
    }

    let definitionText = '';

    if (selectedElements.length === 1) {
      // Un solo elemento - formato en línea
      const element = selectedElements[0];
      definitionText =
        `${element.model || 'N/A'}, ` +
        `${element.central?.central_name || 'N/A'}, ` +
        `${element.acronym || 'N/A'}, ` +
        `${element.service_ip || 'N/A'}, ` +
        `Edo.${element.central?.state?.state || 'N/A'}`;
    } else {
      // Múltiples elementos - con saltos de línea
      definitionText = selectedElements
        .map(
          (element, index) =>
            `• ${element.model || 'N/A'}, ${
              element.central?.central_name || 'N/A'
            }, ${element.acronym || 'N/A'}, ${
              element.service_ip || 'N/A'
            }, Edo. ${element.central?.state?.state || 'N/A'}`
        )
        .join('\n');
    }

    this.ticketForm.patchValue({
      definition_problem: definitionText,
    });
  }

  private autocompleteWithFiberLength(): void {
    const selectedFiber = this.selectedFiberLength();

    if (!selectedFiber) {
      return;
    }

    const definitionText =
      `Tramo: ${selectedFiber.section_name || 'N/A'}, ` +
      `Origen: ${selectedFiber.stateA?.state || 'N/A'}, ` +
      `Destino: ${selectedFiber.stateB?.state || 'N/A'}`;

    // Actualizar el campo de definición del problema
    this.ticketForm.patchValue({
      definition_problem: definitionText,
    });
  }

  private clearDefinitionProblem(): void {
    this.ticketForm.patchValue({
      definition_problem: '',
    });
  }

  removeNetworkElementFromSelection(element: NetworkElement): void {
    this.selectedNetworkElements.set(
      this.selectedNetworkElements().filter((el) => el.id !== element.id)
    );

    // Actualizar la definición después de remover
    if (this.selectionType() === 'network') {
      this.autocompleteWithNetworkElement();
    }
  }

  // ========== MÉTODOS PARA PLATAFORMAS Y GRUPOS ==========

  private setupGroupPlatformDependency(): void {
    this.groupChangeSubscription = this.ticketForm
      .get('groupId')
      ?.valueChanges.subscribe((groupId) => {
        this.onGroupChange(groupId);
      });
  }

  private loadInitialPlatforms(): void {
    const groupId = this.ticketForm.get('groupId')?.value;
    if (groupId && groupId > 0) {
      this.loadPlatformsByGroup(groupId);
    } else {
      this.filteredPlatforms.set(this.platformsResource.value() || []);
    }
  }

  private onGroupChange(groupId: number | null): void {
    if (groupId && groupId > 0) {
      this.loadPlatformsByGroup(groupId);
    } else {
      this.filteredPlatforms.set(this.platformsResource.value() || []);
      this.ticketForm.patchValue({ platformId: 0 });
    }
  }

  private loadPlatformsByGroup(groupId: number): void {
    this.platformsService.getPlatformsByGroup(groupId).subscribe({
      next: (platforms) => {
        this.filteredPlatforms.set(platforms);

        const currentPlatformId = this.ticketForm.get('platformId')?.value;
        if (currentPlatformId && currentPlatformId > 0) {
          const currentPlatformExists = platforms.some(
            (p) => p.id === currentPlatformId
          );
          if (!currentPlatformExists) {
            this.ticketForm.patchValue({ platformId: 0 });
          }
        }
      },
      error: () => {
        this.filteredPlatforms.set(this.platformsResource.value() || []);
      },
    });
  }

  // ========== MÉTODOS PRINCIPALES ==========

  onStatusClick(): void {
    Swal.fire({
      title: 'Información',
      html: 'Cuando el ticket está "en proceso" solo debe modificarse su estatus a través del Cierre de Ticket ó Cancelación de Ticket.<br><br><strong>Menú tickets → Información ticket → Pestaña cierre.</strong>',
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3b82f6',
      width: 600,
    });
  }

  onFailureChange(failureId: number | null): void {
    if (failureId === this.FIBER_CUT_FAILURE_ID) {
      this.selectionType.set('fiber');
      this.isSelectionLocked.set(true);
      this.ticketForm.patchValue({ elementNetworkId: [] });
      this.selectedNetworkElements.set([]);
    } else {
      this.isSelectionLocked.set(false);
    }
  }

  onSelectionTypeChange(type: 'network' | 'fiber'): void {
    if (this.isSelectionLocked()) return;

    this.selectionType.set(type);

    if (type === 'network') {
      this.ticketForm.patchValue({ fiberLengthId: null });
      this.selectedFiberLength.set(null);
    } else {
      this.ticketForm.patchValue({ elementNetworkId: [] });
      this.selectedNetworkElements.set([]);
    }
  }

  setFormValue(ticket: Ticket): void {
    // Determinar tipo de selección
    if (ticket.fiberLengthId) {
      this.selectionType.set('fiber');
      this.isSelectionLocked.set(
        ticket.failureId === this.FIBER_CUT_FAILURE_ID
      );
    } else {
      this.selectionType.set('network');
      this.isSelectionLocked.set(false);
    }

    // Preparar datos
    const dateHdc = ticket.date_hdc
      ? this.formatDateForInput(ticket.date_hdc)
      : null;
    const dateHct = ticket.date_hct
      ? this.formatDateForInput(ticket.date_hct)
      : null;

    // Verificar datos de reporte telefónico
    const hasPhoneReport =
      !!ticket.personPhoneReport &&
      !!ticket.personPhoneReport.name &&
      !!ticket.personPhoneReport.phone;
    this.hasExistingPhoneReport.set(hasPhoneReport);

    // Aplicar datos base
    const baseFormData: any = {
      groupId: ticket.groupId,
      severityId: ticket.severityId,
      platformId: ticket.platformId,
      originId: ticket.originId,
      failureId: ticket.failureId,
      statusId: ticket.statusId,
      elementNetworkId: (ticket.network_elements ?? []).map((el) =>
        typeof el === 'number' ? el : el.id
      ),
      fiberLengthId: ticket.fiberLengthId || null,
      definition_problem: ticket.definition_problem,
      evidences_problem: ticket.evidences_problem || '',
      hypothesis: ticket.hypothesis,
      personalRegionId: ticket.personalRegionId || null,
      impact: ticket.impact,
      date_hif: this.formatDateForInput(ticket.date_hif),
      date_hdc: dateHdc,
      date_hct: dateHct,
    };

    this.ticketForm.patchValue(baseFormData);

    // Cargar datos de reporte telefónico
    if (hasPhoneReport) {
      this.ticketForm.patchValue({
        personPhoneReport: {
          name: ticket.personPhoneReport!.name,
          phone: ticket.personPhoneReport!.phone,
        },
      });
    } else {
      this.ticketForm.patchValue({
        personPhoneReport: { name: '', phone: '' },
      });
    }

    // Configurar estado de campos
    this.configureReportingFieldsState(ticket.originId, hasPhoneReport);

    // Deshabilitar estatus
    this.ticketForm.get('statusId')?.disable();

    // Cargar elementos seleccionados
    if (ticket.network_elements && ticket.network_elements.length > 0) {
      this.selectedNetworkElements.set(
        ticket.network_elements.filter(
          (el): el is NetworkElement => typeof el !== 'number'
        )
      );
    }

    if (ticket.fiber_length) {
      this.selectedFiberLength.set(ticket.fiber_length);
    }

    if (ticket.personal_region) {
      this.selectedPersonal.set(ticket.personal_region);
    }

    // Cargar plataformas filtradas
    if (ticket.groupId) {
      this.loadPlatformsByGroup(ticket.groupId);
    }
  }

  private configureReportingFieldsState(
    originId: number,
    hasExistingData: boolean
  ): void {
    const TELEPHONE_ORIGIN_ID = 3;
    const shouldShowFields =
      originId === TELEPHONE_ORIGIN_ID || hasExistingData;
    this.showReportingFields.set(shouldShowFields);

    if (originId === TELEPHONE_ORIGIN_ID) {
      this.ticketForm.get('personPhoneReport')?.enable();
      this.ticketForm
        .get('personPhoneReport.name')
        ?.setValidators([Validators.required, Validators.minLength(3)]);
      this.ticketForm
        .get('personPhoneReport.phone')
        ?.setValidators([Validators.required, this.phoneValidator]);
    } else {
      this.ticketForm.get('personPhoneReport.name')?.clearValidators();
      this.ticketForm.get('personPhoneReport.phone')?.clearValidators();
      this.ticketForm.get('personPhoneReport')?.enable();
    }

    this.ticketForm.get('personPhoneReport.name')?.updateValueAndValidity();
    this.ticketForm.get('personPhoneReport.phone')?.updateValueAndValidity();
  }

  onSubmit(): void {
    this.ticketForm.markAllAsTouched();

    if (!this.validateDateTimeFields()) {
      return;
    }

    // Validaciones específicas
    let specificError = '';
    if (
      this.selectionType() === 'network' &&
      this.ticketForm.get('elementNetworkId')?.value?.length === 0
    ) {
      specificError = 'Por favor seleccione al menos un elemento de red';
    }
    if (
      this.selectionType() === 'fiber' &&
      !this.ticketForm.get('fiberLengthId')?.value
    ) {
      specificError = 'Por favor seleccione un tramo de fibra';
    }

    if (specificError) {
      Swal.fire({
        title: 'Error',
        text: specificError,
        icon: 'error',
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    if (!this.ticketForm.valid) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos correctamente',
        icon: 'error',
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    const formValue = this.ticketForm.getRawValue();
    const ticketData: any = { ...formValue };

    // Manejo de personPhoneReport
    const originId = formValue.originId;
    const personPhoneReport = formValue.personPhoneReport;
    const hasPhoneData =
      personPhoneReport?.name?.trim() || personPhoneReport?.phone?.trim();

    if (originId === 3 && hasPhoneData) {
      ticketData.personPhoneReport = {
        name: personPhoneReport.name?.trim() || '',
        phone: personPhoneReport.phone?.trim() || '',
      };
    } else if (this.hasExistingPhoneReport() && hasPhoneData) {
      ticketData.personPhoneReport = {
        name: personPhoneReport.name?.trim() || '',
        phone: personPhoneReport.phone?.trim() || '',
      };
    } else {
      ticketData.personPhoneReport = undefined;
    }

    // Limpiar campos opcionales
    ticketData.date_hdc = ticketData.date_hdc || null;
    ticketData.date_hct = ticketData.date_hct || null;
    ticketData.personalRegionId = ticketData.personalRegionId || null;
    ticketData.fiberLengthId = ticketData.fiberLengthId || null;
    ticketData.impact = ticketData.impact || null;

    this.ticketsService
      .updateTicket(this.ticket().id_ticket, ticketData)
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Éxito',
            text: 'El ticket se actualizó correctamente',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
          }).then(() => this.navigateAfterSubmit());
        },
        error: (error) => {
          let errorMessage = 'Ocurrió un error al actualizar el ticket';
          if (error.error?.message) {
            errorMessage = Array.isArray(error.error.message)
              ? error.error.message.join(', ')
              : error.error.message;
          }
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        },
      });
  }

  private navigateAfterSubmit(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/tickets']);
    } else {
      this.router.navigate(['/']);
    }
  }

  onCancel(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Perderás todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/admin/tickets']);
      }
    });
  }

  // ========== MÉTODOS AUXILIARES ==========

  formatDateForInput(date: Date | string): string {
    const dateObj = new Date(date);
    const timezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - timezoneOffset);
    return localTime.toISOString().slice(0, 16);
  }

  loadFilterOptions(): void {
    this.statesServices.getStates().subscribe({
      next: (states) => (this.statesList = states),
      error: (err) => console.error('Error loading states', err),
    });

    this.groupsEscalatoryServices.getGroupsEscalatory().subscribe({
      next: (groups) => (this.groupsList = groups),
      error: (err) => console.error('Error loading groups', err),
    });
  }

  // ========== MÉTODOS DE BÚSQUEDA ==========

  private setupSearchDebouncing(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.networkElementsSearch.set(searchTerm);
        this.currentPage.set(1);
        searchTerm.length === 0
          ? this.loadNetworkElements()
          : this.searchNetworkElements();
      });

    this.fiberSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.fiberLengthsSearch.set(searchTerm);
        this.fiberCurrentPage.set(1);
        searchTerm.length === 0
          ? this.loadFiberLengths()
          : this.searchFiberLengths();
      });

    this.personalSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.personalsSearch.set(searchTerm);
        this.personalCurrentPage.set(1);
        searchTerm.length === 0 ? this.loadPersonals() : this.searchPersonals();
      });
  }

  // ========== MÉTODOS PARA ELEMENTOS DE RED ==========

  openNetworkElementsModal(): void {
    this.showNetworkElementsModal.set(true);
    this.loadNetworkElements();
  }

  closeNetworkElementsModal(): void {
    this.showNetworkElementsModal.set(false);
  }

  loadNetworkElements(): void {
    const offset = (this.currentPage() - 1) * this.itemsPerPage;
    this.networkElementsService
      .getNetworkElements({ limit: this.itemsPerPage, offset })
      .subscribe({
        next: (response) => {
          this.allNetworkElements.set(response.networksElements);
          this.totalPages.set(Math.ceil(response.count / this.itemsPerPage));
        },
        error: (err) => {
          console.error('Error loading network elements', err);
          this.isError.set('Error al cargar elementos de red');
        },
      });
  }

  searchNetworkElements(): void {
    const searchTerm = this.networkElementsSearch();
    this.networkElementsService.getNetworkElementBy(searchTerm).subscribe({
      next: (elements) => {
        this.allNetworkElements.set(elements);
        this.totalPages.set(1);
      },
      error: (err) => {
        console.error('Error searching network elements', err);
        this.allNetworkElements.set([]);
        this.totalPages.set(1);
      },
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  toggleNetworkElementSelection(element: NetworkElement): void {
    const currentSelection = this.selectedNetworkElements();
    const index = currentSelection.findIndex((el) => el.id === element.id);

    if (index > -1) {
      // Deseleccionar elemento
      this.selectedNetworkElements.set(
        currentSelection.filter((el) => el.id !== element.id)
      );
    } else {
      // Seleccionar elemento
      this.selectedNetworkElements.set([...currentSelection, element]);
    }

    // Siempre autocompletar después de cualquier cambio en la selección
    if (this.selectionType() === 'network') {
      this.autocompleteWithNetworkElement();
    }
  }

  isElementSelected(element: NetworkElement): boolean {
    return this.selectedNetworkElements().some((el) => el.id === element.id);
  }

  saveNetworkElementsSelection(): void {
    const selectedIds = this.selectedNetworkElements().map((el) => el.id);
    this.ticketForm.patchValue({
      elementNetworkId: selectedIds,
    });

    // El autocompletado ya se ejecutó durante la selección/deselección
    if (this.selectionType() === 'network' && selectedIds.length > 0) {
      this.autocompleteWithNetworkElement();
    }

    this.closeNetworkElementsModal();
  }

  getSelectedNetworkElementsText(): string {
    const selected = this.selectedNetworkElements();
    return selected.length === 0
      ? 'Seleccione elementos de red'
      : selected.map((el) => el.acronym).join(', ');
  }

  getPaginationRange(): (number | string)[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const delta = 2;
    const range = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');

    range.unshift(1);
    range.push(total);

    return range;
  }

  goToPage(page: number | string): void {
    if (
      this.searchMode() === 'all' &&
      typeof page === 'number' &&
      page >= 1 &&
      page <= this.totalPages()
    ) {
      this.currentPage.set(page);
      this.loadNetworkElements();
    }
  }

  // ========== MÉTODOS PARA TRAMOS DE FIBRA ==========

  openFiberLengthsModal(): void {
    this.showFiberLengthsModal.set(true);
    this.loadFiberLengths();
  }

  closeFiberLengthsModal(): void {
    this.showFiberLengthsModal.set(false);
  }

  loadFiberLengths(): void {
    const offset = (this.fiberCurrentPage() - 1) * this.fiberItemsPerPage;
    this.fiberLengthsService
      .getFiberLengths({ limit: this.fiberItemsPerPage, offset })
      .subscribe({
        next: (response: FiberLengthsResponse) => {
          this.allFiberLengths.set(response.fiberLengths);
          this.fiberTotalPages.set(
            Math.ceil(response.count / this.fiberItemsPerPage)
          );
        },
        error: (err) => {
          console.error('Error loading fiber lengths', err);
          this.isError.set('Error al cargar tramos de fibra');
        },
      });
  }

  searchFiberLengths(): void {
    const searchTerm = this.fiberLengthsSearch();
    this.fiberLengthsService.searchFiberLengths(searchTerm).subscribe({
      next: (fiberLengths) => {
        this.allFiberLengths.set(fiberLengths);
        this.fiberTotalPages.set(1);
      },
      error: (err) => {
        console.error('Error searching fiber lengths', err);
        this.allFiberLengths.set([]);
        this.fiberTotalPages.set(1);
      },
    });
  }

  onFiberSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fiberSearchSubject.next(value);
  }

  selectFiberLength(fiberLength: FiberLength): void {
    this.selectedFiberLength.set(fiberLength);
    if (this.selectionType() === 'fiber') {
      this.autocompleteWithFiberLength();
    }
  }

  isFiberLengthSelected(fiberLength: FiberLength): boolean {
    return this.selectedFiberLength()?.id === fiberLength.id;
  }

  saveFiberLengthSelection(): void {
    const selectedFiber = this.selectedFiberLength();
    if (selectedFiber) {
      this.ticketForm.patchValue({
        fiberLengthId: selectedFiber.id,
        elementNetworkId: [],
      });
      this.autocompleteWithFiberLength();
    }
    this.closeFiberLengthsModal();
  }

  getSelectedFiberLengthText(): string {
    const selected = this.selectedFiberLength();
    return !selected
      ? 'Seleccione un tramo de fibra'
      : `${selected.section_name} (${selected.locality_a} - ${selected.locality_b})`;
  }

  getFiberPaginationRange(): (number | string)[] {
    const current = this.fiberCurrentPage();
    const total = this.fiberTotalPages();
    const delta = 2;
    const range = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');

    range.unshift(1);
    range.push(total);

    return range;
  }

  goToFiberPage(page: number | string): void {
    if (
      this.fiberSearchMode() === 'all' &&
      typeof page === 'number' &&
      page >= 1 &&
      page <= this.fiberTotalPages()
    ) {
      this.fiberCurrentPage.set(page);
      this.loadFiberLengths();
    }
  }

  // ========== MÉTODOS PARA RESPONSABLES ==========

  openPersonalsModal(): void {
    this.showPersonalsModal.set(true);
    this.loadPersonals();
  }

  closePersonalsModal(): void {
    this.showPersonalsModal.set(false);
  }

  loadPersonals(): void {
    const offset = (this.personalCurrentPage() - 1) * this.personalItemsPerPage;
    this.personalsRegionService
      .getPersonalRegion({ limit: this.personalItemsPerPage, offset })
      .subscribe({
        next: (response: PersonalsRegion) => {
          this.allPersonals.set(response.personalsRegions || []);
          this.personalTotalPages.set(
            Math.ceil(response.count / this.personalItemsPerPage)
          );
        },
        error: (err) => {
          console.error('Error loading personals', err);
          this.isError.set('Error al cargar responsables');
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
        next: (personals: PersonalRegion[]) => {
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

  selectPersonal(personal: PersonalRegion): void {
    this.selectedPersonal.set(personal);
  }

  isPersonalSelected(personal: PersonalRegion): boolean {
    return this.selectedPersonal()?.id === personal.id;
  }

  savePersonalSelection(): void {
    const selectedPersonal = this.selectedPersonal();
    if (selectedPersonal) {
      this.ticketForm.patchValue({ personalRegionId: selectedPersonal.id });
    }
    this.closePersonalsModal();
  }

  getSelectedPersonalText(): string {
    const selected = this.selectedPersonal();
    if (!selected) return 'Seleccione un responsable';

    const groups =
      selected.groups_escalatory?.map((g) => g.group_escalatory).join(', ') ||
      'Sin grupo';
    const states =
      selected.states?.map((s) => s.state).join(', ') || 'Sin estado';
    const position = selected.position?.[0]?.position || 'Sin cargo';

    return `${selected.names} ${selected.surnames} - ${groups} - ${states} - ${position}`;
  }

  getPersonalPaginationRange(): (number | string)[] {
    const current = this.personalCurrentPage();
    const total = this.personalTotalPages();
    const delta = 2;
    const range = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');

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
}
