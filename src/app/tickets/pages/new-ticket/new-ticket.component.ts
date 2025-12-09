import { Component, inject, signal, OnInit, effect } from '@angular/core';
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
import {
  FiberLength,
  FiberLengthsResponse,
} from '@features/fiber-lengths/interfaces/fiber-length.interface';
import {
  PersonalRegion,
  PersonalsRegion,
} from '@features/personal-region/interfaces/personal-region.interface';
import { Status } from '@features/statuses/interfaces/status.interface';
import { Platform } from '@features/platforms/interfaces/platform.interface';

@Component({
  selector: 'app-new-ticket',
  imports: [ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './new-ticket.component.html',
  styles: `
  .collapse-arrow .collapse-title:after {
    transition: transform 0.2s ease-in-out;
  }

  .peer:checked ~ .collapse-title:after {
    transform: rotate(180deg);
  }

  .collapse-content {
    transition: max-height 0.3s ease-in-out, opacity 0.2s ease-in-out;
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
export class NewTicketComponent implements OnInit {
  // Inyección de servicios
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
  showReportingFields = signal(false);

  showDateTimeAlert = signal(false);
  dateTimeAlertMessage = signal('');
  private alertTimeout: any = null;

  // tempImages = signal<string[]>([]);
  tempImages = signal<{ url: string; name: string }[]>([]);
  imageFileList: FileList | undefined = undefined;

  isUploading = signal(false);
  uploadProgress = signal(0);

  // Señal para la fecha de apertura del formulario
  formOpenDate = signal(this.getCurrentDateTimeString());

  generatedTicketNumber = signal<string>('');

  filteredPlatforms = signal<Platform[]>([]);

  filteredFailures = signal<any[]>([]);

  // Formulario
  // ticketForm = this.fb.group({
  //   groupId: [0, Validators.required],
  //   severityId: [0, Validators.required],
  //   platformId: [{ value: 0, disabled: true }, Validators.required], // ← Cambiado aquí
  //   originId: [0, Validators.required],
  //   failureId: [0, Validators.required],
  //   statusId: [{ value: 0, disabled: true }, [Validators.required]],
  //   elementNetworkId: this.fb.control<number[]>([]),
  //   fiberLengthId: this.fb.control<number | null>(null),
  //   definition_problem: [
  //     '',
  //     [
  //       Validators.required,
  //       Validators.minLength(10),
  //       Validators.maxLength(500),
  //     ],
  //   ],
  //   evidences_problem: [
  //     '',
  //     [
  //       Validators.required,
  //       Validators.minLength(10),
  //       Validators.maxLength(500),
  //     ],
  //   ],
  //   hypothesis: [
  //     '',
  //     [Validators.required, Validators.minLength(8), Validators.maxLength(500)],
  //   ],
  //   personalRegionId: this.fb.control<number | null>(null),
  //   impact: ['', [Validators.min(0)]],
  //   date_hif: ['', Validators.required],
  //   date_hdc: [null],
  //   date_hct: [null],
  //   personPhoneReport: this.fb.group({
  //     name: [''],
  //     phone: [''],
  //   }),
  // });

  ticketForm = this.fb.group({
    groupId: [0, Validators.required],
    severityId: [0, Validators.required],
    platformId: [{ value: 0, disabled: true }, Validators.required],
    originId: [0, Validators.required],
    failureId: [0, Validators.required],
    statusId: [{ value: 0, disabled: true }, [Validators.required]],
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
    impact: ['', [Validators.min(0)]],
    date_hif: ['', Validators.required],
    date_hdc: ['', Validators.required],
    date_hct: ['', Validators.required],
    // Inicializar como null - solo se creará cuando sea necesario
    personPhoneReport: this.fb.group({
      name: [{ value: '', disabled: true }],
      phone: [{ value: '', disabled: true }],
    }),
  });

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

  constructor() {
    // Efecto para inicializar las plataformas filtradas cuando se cargan las plataformas
    effect(() => {
      const platforms = this.platformsResource.value();
      if (platforms && platforms.length > 0) {
        this.filteredPlatforms.set(platforms);
      }
    });
  }

  ngOnInit(): void {
    this.loadStatuses();
    this.loadFilterOptions();
    this.setupSearchDebouncing();

    // Inicializar filteredFailures con todas las fallas
    const allFailures = this.failuresResource.value() || [];
    this.filteredFailures.set(allFailures);

    this.ticketForm.get('failureId')?.valueChanges.subscribe((failureId) => {
      this.onFailureChange(failureId);
    });

    this.ticketForm.get('groupId')?.valueChanges.subscribe((groupId) => {
      this.onGroupChange(groupId);
    });

    this.ticketForm.get('originId')?.valueChanges.subscribe((originId) => {
      this.onOriginChange(originId);
    });

    // Actualizar las suscripciones de fecha
    // this.ticketForm.get('date_hif')?.valueChanges.subscribe(() => {
    //   this.onDateHifChange();
    // });

    this.ticketForm.get('date_hdc')?.valueChanges.subscribe(() => {
      this.onDateHdcChange();
    });

    this.ticketForm.get('date_hct')?.valueChanges.subscribe(() => {
      this.onDateHctChange();
    });
  }

  onOriginChange(originId: number | null): void {
    const TELEPHONE_ORIGIN_ID = 3;

    if (originId === TELEPHONE_ORIGIN_ID) {
      this.showReportingFields.set(true);

      // Habilitar y agregar validadores
      this.ticketForm.get('personPhoneReport')?.enable();
      this.ticketForm
        .get('personPhoneReport.name')
        ?.setValidators([Validators.required, Validators.minLength(3)]);
      this.ticketForm
        .get('personPhoneReport.phone')
        ?.setValidators([Validators.required, this.phoneValidator]);
    } else {
      this.showReportingFields.set(false);

      // Remover validadores, limpiar valores y deshabilitar
      this.ticketForm.get('personPhoneReport.name')?.clearValidators();
      this.ticketForm.get('personPhoneReport.phone')?.clearValidators();

      this.ticketForm.patchValue({
        personPhoneReport: {
          name: '',
          phone: '',
        },
      });

      this.ticketForm.get('personPhoneReport')?.disable();
    }

    this.ticketForm.get('personPhoneReport.name')?.updateValueAndValidity();
    this.ticketForm.get('personPhoneReport.phone')?.updateValueAndValidity();
  }

  phoneValidator(control: any) {
    if (!control.value) {
      return null;
    }

    const phone = control.value.trim();

    // Patrón para números venezolanos: 0212-6630824 o 0414-1234567
    const phonePattern = /^(02\d{2}-?\d{7}|04(14|24|16|26|12|22)-?\d{7})$/;

    if (!phonePattern.test(phone)) {
      return { invalidPhone: true };
    }

    return null;
  }

  onGroupChange(groupId: number | null): void {
    if (!groupId || groupId === 0) {
      // Si no hay grupo seleccionado, deshabilitar plataforma y mostrar todas las fallas
      this.ticketForm.get('platformId')?.disable();
      const allPlatforms = this.platformsResource.value() || [];
      this.filteredPlatforms.set(allPlatforms);

      // Mostrar todas las fallas
      const allFailures = this.failuresResource.value() || [];
      this.filteredFailures.set(allFailures);

      this.ticketForm.patchValue({
        platformId: 0,
        failureId: 0, // Resetear la falla seleccionada
      });
      return;
    }

    // Habilitar plataforma cuando hay un grupo seleccionado
    this.ticketForm.get('platformId')?.enable();

    // Filtrar plataformas que pertenecen al grupo seleccionado
    const allPlatforms = this.platformsResource.value() || [];
    const platformsForGroup = allPlatforms.filter((platform) =>
      platform.groups?.some((group) => group.id === groupId)
    );
    this.filteredPlatforms.set(platformsForGroup);

    // ✅ NUEVO: Cargar las fallas específicas para este grupo
    this.loadFailuresByGroup(groupId);

    // Resetear la plataforma si la selección actual no pertenece al grupo
    const currentPlatformId = this.ticketForm.get('platformId')?.value;
    if (currentPlatformId && currentPlatformId !== 0) {
      const currentPlatformValid = platformsForGroup.some(
        (platform) => platform.id === currentPlatformId
      );
      if (!currentPlatformValid) {
        this.ticketForm.patchValue({ platformId: 0 });
      }
    }
  }

  loadFailuresByGroup(groupId: number): void {
    this.groupsService.getFailuresByGroup(groupId).subscribe({
      next: (failures) => {
        // El endpoint retorna un array de fallas directamente
        this.filteredFailures.set(failures || []);

        // Resetear la falla seleccionada si no está en las nuevas opciones
        const currentFailureId = this.ticketForm.get('failureId')?.value;
        if (currentFailureId && currentFailureId !== 0) {
          const currentFailureValid = failures?.some(
            (failure: any) => failure.id === currentFailureId
          );
          if (!currentFailureValid) {
            this.ticketForm.patchValue({ failureId: 0 });
          }
        }
      },
      error: (error) => {
        console.error('Error loading failures for group:', error);
        this.filteredFailures.set([]);
        this.ticketForm.patchValue({ failureId: 0 });
      },
    });
  }

  private getCurrentDateTimeString(): string {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - timezoneOffset);
    return localTime.toISOString().slice(0, 16);
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
    this.clearDefinitionProblem();

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

  onSubmit(): void {
    this.ticketForm.markAllAsTouched();

    if (!this.validateDateTimeFields()) {
      return;
    }

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

    // ✅ Usar getRawValue() para incluir campos disabled (como statusId)
    const formValue = this.ticketForm.getRawValue();

    // console.log('Datos a enviar:', formValue);

    // Preparar los datos base del ticket (sin imágenes todavía)
    const ticketData: any = {
      ...formValue,
      formOpenDate: this.formOpenDate(),
      images: [], // Inicializar como array vacío
    };

    if (this.ticketForm.get('personPhoneReport')?.disabled) {
      ticketData.personPhoneReport = undefined;
    }

    // Asegurar que los campos opcionales sean null si están vacíos
    ticketData.date_hdc = ticketData.date_hdc || null;
    ticketData.date_hct = ticketData.date_hct || null;
    ticketData.personalRegionId = ticketData.personalRegionId || null;
    ticketData.fiberLengthId = ticketData.fiberLengthId || null;
    ticketData.impact = ticketData.impact || null;

    // Mostrar estado de carga
    this.isUploading.set(true);

    // 1. Primero subir las imágenes al endpoint de files
    this.ticketsService.uploadImages(this.imageFileList).subscribe({
      next: (imageUrls) => {
        // Filtrar posibles errores en la subida
        const successfulUploads = imageUrls.filter(
          (url) => !url.startsWith('error_')
        );
        const failedUploads = imageUrls.filter((url) =>
          url.startsWith('error_')
        );

        if (failedUploads.length > 0) {
          console.warn(
            `${failedUploads.length} imágenes no se subieron correctamente`
          );
          // Opcional: mostrar advertencia al usuario
        }

        // 2. Agregar las URLs de las imágenes al ticket
        ticketData.images = successfulUploads;

        // console.log('Creando ticket con imágenes:', ticketData);

        // 3. Crear el ticket con las URLs de las imágenes
        this.ticketsService.createTicket(ticketData).subscribe({
          next: (ticket) => {
            this.isUploading.set(false);
            this.generatedTicketNumber.set(ticket.nro_ticket);
            Swal.fire({
              title: 'Éxito',
              html: `El ticket <strong>${ticket.nro_ticket}</strong> se creó correctamente`,
              icon: 'success',
              showConfirmButton: true,
              confirmButtonText: 'Aceptar',
            }).then(() => {
              this.navigateAfterSubmit();
            });
          },
          error: (error) => {
            this.isUploading.set(false);
            console.error('Error creating ticket:', error);

            // Manejo de errores...
          },
        });
      },
      error: (uploadError) => {
        this.isUploading.set(false);
        console.error('Error subiendo imágenes:', uploadError);

        // Intentar crear el ticket sin imágenes
        Swal.fire({
          title: 'Error al subir imágenes',
          text: '¿Deseas crear el ticket sin las imágenes?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, crear sin imágenes',
          cancelButtonText: 'No, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            ticketData.images = [];
            this.ticketsService.createTicket(ticketData).subscribe({
              next: (ticket) => {
                Swal.fire({
                  title: 'Éxito',
                  text: 'El ticket se creó sin imágenes',
                  icon: 'success',
                  showConfirmButton: false,
                  timer: 1500,
                }).then(() => {
                  this.navigateAfterSubmit();
                });
              },
              error: (error) => {
                console.error('Error creating ticket without images:', error);
                // Manejo de errores...
              },
            });
          }
        });
      },
    });
  }

  private navigateAfterSubmit(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/tickets']);
    } else {
      this.router.navigate(['/tickets']);
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
        this.ticketForm.reset();
        // Restablecer la fecha de apertura al cancelar
        this.formOpenDate.set(this.getCurrentDateTimeString());
        this.navigateAfterSubmit();
      }
    });
  }

  loadStatuses(): void {
    this.statusesService.getStatuses().subscribe({
      next: (statuses) => {
        this.statusesResource.set(statuses);
        this.setDefaultStatus(statuses);

        // ✅ Controlar el estado disabled del campo statusId
        // if (statuses.length === 0) {
        //   this.ticketForm.get('statusId')?.disable();
        // } else {
        //   this.ticketForm.get('statusId')?.enable();
        // }
      },
      error: (err) => {
        console.error('Error loading statuses', err);
        // ✅ Deshabilitar el campo si hay error
        // this.ticketForm.get('statusId')?.disable();
      },
    });
  }

  private setDefaultStatus(statuses: Status[]): void {
    try {
      if (!Array.isArray(statuses)) {
        throw new Error('Statuses debe ser un array');
      }

      if (statuses.length === 0) {
        console.warn('No hay statuses disponibles');
        return;
      }

      const defaultStatus =
        statuses.find((s) => s.status.toLowerCase().trim() === 'en proceso') ??
        statuses[0];

      // ✅ Establecer valor manteniendo el estado disabled
      this.ticketForm
        .get('statusId')
        ?.setValue(defaultStatus.id, { emitEvent: false });
    } catch (error) {
      console.error('Error al establecer status por defecto:', error);
      if (statuses?.length) {
        this.ticketForm.get('statusId')?.setValue(statuses[0].id);
      }
    }
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
        // group: '',
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
      // Deseleccionar elemento
      this.selectedNetworkElements.set(
        currentSelection.filter((el) => el.id !== element.id)
      );
    } else {
      // Seleccionar elemento
      this.selectedNetworkElements.set([...currentSelection, element]);
    }

    // ✅ NUEVO: Siempre autocompletar después de cualquier cambio en la selección
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

    // ✅ NUEVO: El autocompletado ya se ejecutó durante la selección/deselección
    // pero lo mantenemos por si acaso hay algún caso edge
    if (this.selectionType() === 'network' && selectedIds.length > 0) {
      this.autocompleteWithNetworkElement();
    }

    this.closeNetworkElementsModal();
  }

  // getSelectedNetworkElementsText(): string {
  //   const selected = this.selectedNetworkElements();
  //   if (selected.length === 0) {
  //     return 'Seleccione elementos de red';
  //   }
  //   return selected.map((el) => el.acronym).join(', ');
  // }

  getSelectedNetworkElementsText(): string {
    const selected = this.selectedNetworkElements();
    if (selected.length === 0) {
      return 'Seleccione elementos de red';
    }

    // Resumen: cantidad de elementos seleccionados
    return `${selected.length} elemento(s) seleccionado(s)`;
  }

  getSelectedNetworkElementsTooltip(): string {
    const selected = this.selectedNetworkElements();
    if (selected.length === 0) {
      return '';
    }

    // Formato para tooltip: cada elemento en una línea
    return selected
      .map(
        (element) =>
          `${element.acronym}, ${element.model}, ${element.description}`
      )
      .join('\n');
  }

  getFormattedNetworkElement(element: NetworkElement): string {
    return `${element.acronym}, ${element.model}, ${element.description}`;
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

  //Images
  onFilesChange(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;
    this.imageFileList = fileList ?? undefined;

    if (!fileList) return;

    const newImages = Array.from(fileList).map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    this.tempImages.set([...this.tempImages(), ...newImages]);
  }

  ngOnDestroy() {
    this.tempImages().forEach((img) => URL.revokeObjectURL(img.url));

    // Limpiar el timeout del alert
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  removeImage(index: number) {
    const currentImages = this.tempImages();
    URL.revokeObjectURL(currentImages[index].url); // Liberar memoria

    // Crear nuevos arrays para las imágenes
    const newTempImages = currentImages.filter((_, i) => i !== index);

    if (this.imageFileList) {
      // Crear nuevo FileList sin la imagen eliminada
      const filesArray = Array.from(this.imageFileList);
      filesArray.splice(index, 1);

      // Crear un nuevo DataTransfer para simular FileList
      const dataTransfer = new DataTransfer();
      filesArray.forEach((file) => dataTransfer.items.add(file));
      this.imageFileList = dataTransfer.files;
    }

    this.tempImages.set(newTempImages);
  }

  // Método helper para formatear el teléfono (opcional)
  formatPhone(event: any): void {
    const phoneControl = this.ticketForm.get('personPhoneReport.phone');
    if (!phoneControl) return;

    let phone = event.target.value.replace(/\D/g, ''); // Remover todo excepto números

    if (phone.length >= 4) {
      phone = phone.substring(0, 4) + '-' + phone.substring(4);
    }

    if (phone.length > 12) {
      phone = phone.substring(0, 12);
    }

    phoneControl.setValue(phone);
  }

  private validateDateTimeFields(): boolean {
    const formOpenDate = new Date(this.formOpenDate());

    const dateHifValue = this.ticketForm.get('date_hif')?.value;
    const dateHdcValue = this.ticketForm.get('date_hdc')?.value;
    const dateHctValue = this.ticketForm.get('date_hct')?.value;

    const dateHif = dateHifValue ? new Date(dateHifValue) : null;
    const dateHdc = dateHdcValue ? new Date(dateHdcValue) : null;
    const dateHct = dateHctValue ? new Date(dateHctValue) : null;

    // Validación 1: Hora inicio falla debe ser mayor a creación del ticket
    // if (dateHif && dateHif <= formOpenDate) {
    //   this.showDateTimeError(
    //     'La hora de inicio de falla debe ser posterior a la hora de creación del ticket'
    //   );
    //   return false;
    // }

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

  // onDateHifChange(): void {
  //   const dateHifValue = this.ticketForm.get('date_hif')?.value;
  //   if (!dateHifValue) return;

  //   const formOpenDate = new Date(this.formOpenDate());
  //   const selectedDate = new Date(dateHifValue);

  //   if (selectedDate <= formOpenDate) {
  //     this.showDateTimeError(
  //       'La hora de inicio de falla debe ser posterior a la creación del ticket'
  //     );
  //     this.ticketForm.patchValue({ date_hif: '' });
  //   }
  // }

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

  onOptionalDateChange(fieldName: string): void {
    const dateValue = this.ticketForm.get(fieldName)?.value;
    const dateHifValue = this.ticketForm.get('date_hif')?.value;

    if (!dateValue || !dateHifValue) return;

    const selectedDate = new Date(dateValue);
    const inicioFallaDate = new Date(dateHifValue);

    if (selectedDate < inicioFallaDate) {
      const fieldNames: { [key: string]: string } = {
        date_hdc: 'diagnóstico COR',
        date_hct: 'contacto técnico',
      };

      // Configurar SweetAlert con mayor z-index
      Swal.fire({
        title: 'Fecha inválida',
        text: `La hora de ${fieldNames[fieldName]} no puede ser anterior a la hora de inicio de falla`,
        icon: 'warning',
        confirmButtonText: 'Corregir',
        customClass: {
          popup: 'sweetalert-high-zindex',
        },
        didOpen: () => {
          // Forzar el cierre del calendario después de abrir el SweetAlert
          const dateInput = document.getElementById(
            fieldName
          ) as HTMLInputElement;
          if (dateInput) {
            dateInput.blur();
          }
        },
      }).then(() => {
        this.ticketForm.patchValue({ [fieldName]: '' });
      });
    }
  }

  // Métodos auxiliares para validaciones en el template
  isDateHifInvalid(): boolean {
    const dateHifValue = this.ticketForm.get('date_hif')?.value;
    if (!dateHifValue) return false;

    const selectedDate = new Date(dateHifValue);
    const formOpenDate = new Date(this.formOpenDate());
    return selectedDate <= formOpenDate;
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

    // Ocultar automáticamente después de 3 segundos (3000ms)
    this.alertTimeout = setTimeout(() => {
      this.showDateTimeAlert.set(false);
    }, 4000);
  }

  // Ultimos

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
      const { ip, type } = this.getPriorityIpInfo(element);

      definitionText =
        `${element.model || 'N/A'}, ` +
        `${element.central?.central_name || 'N/A'}, ` +
        `${element.acronym || 'N/A'}, ` +
        `IP ${type.toUpperCase()}: ${ip}, ` +
        `Edo.${element.central?.state?.state || 'N/A'}`;
    } else {
      // Múltiples elementos - con saltos de línea
      definitionText = selectedElements
        .map((element, index) => {
          const { ip, type } = this.getPriorityIpInfo(element);

          return `• ${element.model || 'N/A'}, ${
            element.central?.central_name || 'N/A'
          }, ${
            element.acronym || 'N/A'
          }, IP ${type.toUpperCase()}: ${ip}, Edo. ${
            element.central?.state?.state || 'N/A'
          }`;
        })
        .join('\n');
    }

    this.ticketForm.patchValue({
      definition_problem: definitionText,
    });
  }

  private getPriorityIpInfo(element: any): { ip: string; type: string } {
    if (element.service_ip) {
      return { ip: element.service_ip, type: 'SERVICIO' };
    } else if (element.management_ip) {
      return { ip: element.management_ip, type: 'GESTIÓN' };
    } else if (element.adsl_ip) {
      return { ip: element.adsl_ip, type: 'ADSL' };
    } else {
      return { ip: 'N/A', type: 'NO DISPONIBLE' };
    }
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

    // ✅ NUEVO: Actualizar la definición después de remover
    if (this.selectionType() === 'network') {
      this.autocompleteWithNetworkElement();
    }
  }

  private autocompleteWithMultipleNetworkElements(): void {
    const selectedElements = this.selectedNetworkElements();

    if (selectedElements.length === 0) {
      this.clearDefinitionProblem();
      return;
    }

    let definitionText = '';

    if (selectedElements.length === 1) {
      // Un solo elemento - formato detallado
      const element = selectedElements[0];
      definitionText =
        `Elemento: ${element.model || 'N/A'}, ` +
        `Central: ${element.central?.central_name || 'N/A'}, ` +
        `Acrónimo: ${element.acronym || 'N/A'}, ` +
        `IP Servicio: ${element.service_ip || 'N/A'}, ` +
        `Estado: ${element.central?.state?.state || 'N/A'}`;
    } else {
      // Múltiples elementos - formato resumido
      const acronyms = selectedElements
        .map((el) => el.acronym || 'N/A')
        .join(', ');
      definitionText = `Elementos de red seleccionados: ${acronyms}`;
    }

    this.ticketForm.patchValue({
      definition_problem: definitionText,
    });
  }
}
