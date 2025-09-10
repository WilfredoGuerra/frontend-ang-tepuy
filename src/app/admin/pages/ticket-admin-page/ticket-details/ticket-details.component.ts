import { Component, inject, signal, OnInit, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
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
import { FiberLength, FiberLengthsResponse } from '@features/fiber-lengths/interfaces/fiber-length.interface';
import { PersonalRegion, PersonalsRegion } from '@features/personal-region/interfaces/personal-region.interface';
import { Status } from '@features/statuses/interfaces/status.interface';

@Component({
  selector: 'ticket-details',
  imports: [ReactiveFormsModule, FormErrorLabelComponent],
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
    definition_problem: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    evidences_problem: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    hypothesis: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(500)]],
    personalRegionId: this.fb.control<number | null>(null),
    impact: [0, [Validators.min(0)]],
    date_hif: ['', Validators.required],
    date_hdc: [null as string | null],
    date_hct: [null as string | null],
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

    // Configurar el formulario con los datos del ticket
    this.setFormValue(this.ticket());

    // Suscribirse a cambios en el tipo de falla
    this.ticketForm.get('failureId')?.valueChanges.subscribe((failureId) => {
      this.onFailureChange(failureId);
    });
  }

  private setupSearchDebouncing(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.networkElementsSearch.set(searchTerm);
        this.currentPage.set(1);

        if (searchTerm.length === 0) {
          this.searchMode.set('all');
          this.loadNetworkElements();
        } else {
          this.searchMode.set('filtered');
          this.searchNetworkElements();
        }
      });

    this.fiberSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.fiberLengthsSearch.set(searchTerm);
        this.fiberCurrentPage.set(1);

        if (searchTerm.length === 0) {
          this.fiberSearchMode.set('all');
          this.loadFiberLengths();
        } else {
          this.fiberSearchMode.set('filtered');
          this.searchFiberLengths();
        }
      });

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

  // Cambiar el tipo de selección (elemento de red o tramo de fibra)
  onSelectionTypeChange(type: 'network' | 'fiber'): void {
    if (this.isSelectionLocked()) {
      // Si está bloqueado, no permitir cambiar
      return;
    }

    this.selectionType.set(type);

    // Limpiar selecciones al cambiar de tipo
    if (type === 'network') {
      this.ticketForm.patchValue({
        fiberLengthId: null,
      });
      this.selectedFiberLength.set(null);
    } else {
      this.ticketForm.patchValue({
        elementNetworkId: [],
      });
      this.selectedNetworkElements.set([]);
    }
  }

  setFormValue(ticket: Ticket): void {
    // Determinar el tipo de selección basado en los datos del ticket
    if (ticket.fiberLengthId) {
      this.selectionType.set('fiber');
      this.isSelectionLocked.set(ticket.failureId === this.FIBER_CUT_FAILURE_ID);
    } else {
      this.selectionType.set('network');
      this.isSelectionLocked.set(false);
    }

    // Preparar los valores de fecha
    const dateHdc = ticket.date_hdc ? this.formatDateForInput(ticket.date_hdc) : null;
    const dateHct = ticket.date_hct ? this.formatDateForInput(ticket.date_hct) : null;

    this.ticketForm.patchValue({
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
      impact: ticket.impact || 0,
      date_hif: this.formatDateForInput(ticket.date_hif),
      date_hdc: dateHdc,
      date_hct: dateHct,
    });

    // Cargar elementos seleccionados para mostrar en los modales
    if (ticket.network_elements && ticket.network_elements.length > 0) {
      this.selectedNetworkElements.set(
        ticket.network_elements.filter((el): el is NetworkElement =>
          typeof el !== 'number'
        )
      );
    }

    if (ticket.fiber_length) {
      this.selectedFiberLength.set(ticket.fiber_length);
    }

    if (ticket.personal_region) {
      this.selectedPersonal.set(ticket.personal_region);
    }
  }

  formatDateForInput(date: Date | string): string {
    const dateObj = new Date(date);
    const timezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - timezoneOffset);
    return localTime.toISOString().slice(0, 16);
  }

  onSubmit(): void {
    this.ticketForm.markAllAsTouched();

    let specificError = '';

    if (this.selectionType() === 'network' &&
        this.ticketForm.get('elementNetworkId')?.value?.length === 0) {
      specificError = 'Por favor seleccione al menos un elemento de red';
    }

    if (this.selectionType() === 'fiber' &&
        !this.ticketForm.get('fiberLengthId')?.value) {
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

    // Preparar los datos para enviar
    const ticketData: any = {
      ...formValue,
    };

    // Asegurar que los campos opcionales sean null si están vacíos
    ticketData.date_hdc = ticketData.date_hdc || null;
    ticketData.date_hct = ticketData.date_hct || null;
    ticketData.personalRegionId = ticketData.personalRegionId || null;
    ticketData.fiberLengthId = ticketData.fiberLengthId || null;
    ticketData.impact = ticketData.impact || null;

    this.ticketsService.updateTicket(this.ticket().id_ticket, ticketData).subscribe({
      next: (ticket) => {
        Swal.fire({
          title: 'Éxito',
          text: 'El ticket se actualizó correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
        }).then(() => {
          this.navigateAfterSubmit();
        });
      },
      error: (error) => {
        console.error('Error updating ticket:', error);
        console.error('Detalles del error:', error.error);

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
          confirmButtonText: 'Aceptar'
        });
      }
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

  loadFilterOptions(): void {
    this.statesServices.getStates().subscribe({
      next: (states) => this.statesList = states,
      error: (err) => console.error('Error loading states', err)
    });

    this.groupsEscalatoryServices.getGroupsEscalatory().subscribe({
      next: (groups) => this.groupsList = groups,
      error: (err) => console.error('Error loading groups', err)
    });
  }

  // Métodos para elementos de red
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
      .getNetworkElements({
        limit: this.itemsPerPage,
        offset,
        group: '',
      })
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
      this.selectedNetworkElements.set(
        currentSelection.filter((el) => el.id !== element.id)
      );
    } else {
      this.selectedNetworkElements.set([...currentSelection, element]);
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
    this.closeNetworkElementsModal();
  }

  getSelectedNetworkElementsText(): string {
    const selected = this.selectedNetworkElements();
    if (selected.length === 0) {
      return 'Seleccione elementos de red';
    }
    return selected.map((el) => el.acronym).join(', ');
  }

  getPaginationRange(): (number | string)[] {
    const current = this.currentPage();
    const total = this.totalPages();
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

  // Métodos para tramos de fibra
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
      .getFiberLengths({
        limit: this.fiberItemsPerPage,
        offset,
      })
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
    }
    this.closeFiberLengthsModal();
  }

  getSelectedFiberLengthText(): string {
    const selected = this.selectedFiberLength();
    if (!selected) {
      return 'Seleccione un tramo de fibra';
    }
    return `${selected.section_name} (${selected.locality_a} - ${selected.locality_b})`;
  }

  getFiberPaginationRange(): (number | string)[] {
    const current = this.fiberCurrentPage();
    const total = this.fiberTotalPages();
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

  // Métodos para responsables
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
      .getPersonalRegion({
        limit: this.personalItemsPerPage,
        offset: offset,
      })
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

    this.personalsRegionService.getPersonalRegionByAdvanced(
      searchTerm !== '' ? searchTerm : undefined,
      stateIdParam,
      groupIdParam,
      nameParam,
      surnameParam
    ).subscribe({
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
      this.ticketForm.patchValue({
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
}
