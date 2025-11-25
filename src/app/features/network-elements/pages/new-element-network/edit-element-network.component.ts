import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { GroupsService } from '@features/groups/services/groups.service';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';
import { NetworkElementsService } from '@features/network-elements/services/network-elements.service';
import { PlatformsService } from '@features/platforms/services/platforms.service';
import { ProvidersService } from '@features/providers/services/providers.service';
import Swal from 'sweetalert2';
import { CentralsPageComponent } from '@features/centrals/pages/centrals-page/centrals-page.component';
import { ModalService } from '@app-utils/modal.service';
import { Central } from '@features/centrals/interfaces/central.interface';

@Component({
  selector: 'edit-element-network',
  imports: [ReactiveFormsModule, CentralsPageComponent],
  templateUrl: './new-element-network.component.html', // Puedes reutilizar el mismo template
})
export class EditElementNetworkComponent {
  // Services
  private fb = inject(FormBuilder);
  private networkElementsService = inject(NetworkElementsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private modalService = inject(ModalService);
  private groupsService = inject(GroupsService);
  private platformsService = inject(PlatformsService);
  private providersService = inject(ProvidersService);

  // Signals
  showCentralSelector = signal(false);
  selectedCentral = signal<Central | null>(null);
  elementId = signal<number>(0);
  isLoading = signal(true);

  // Resources
  groupsResource = rxResource({
    params: () => ({}),
    stream: () => this.groupsService.getGroups(),
  });

  platformsResource = rxResource({
    params: () => ({}),
    stream: () => this.platformsService.getPlatforms(),
  });

  providersResource = rxResource({
    params: () => ({}),
    stream: () => this.providersService.getProviders(),
  });

  // Form
  networkElementForm = this.fb.group({
    groupId: [0, [Validators.required, Validators.min(1)]],
    platformId: [0, [Validators.required, Validators.min(1)]],
    management_ip: [''],
    service_ip: [''],
    adsl_ip: [''],
    description: ['', [Validators.required, Validators.minLength(1)]],
    element_id: [''],
    acronym: ['', [Validators.required, Validators.minLength(1)]],
    model: ['', [Validators.required, Validators.minLength(1)]],
    providerId: [0, [Validators.required, Validators.min(1)]],
    locality: ['', [Validators.required, Validators.minLength(1)]],
    centralId: [0, [Validators.required, Validators.min(1)]],
    floor: [''],
    hall: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.elementId.set(id);
        this.loadElementData(id);
      }
    });
  }

  loadElementData(id: number): void {
    this.networkElementsService.getNetworkElementBy(id.toString()).subscribe({
      next: (elements) => {
        if (elements && elements.length > 0) {
          const element = elements[0];
          this.populateForm(element);
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading element:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el elemento de red.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        this.router.navigate(['/admin/network-elements']);
      }
    });
  }

  populateForm(element: NetworkElement): void {
    this.networkElementForm.patchValue({
      groupId: element.groupId,
      platformId: element.platformId,
      management_ip: element.management_ip || '',
      service_ip: element.service_ip || '',
      adsl_ip: element.adsl_ip || '',
      description: element.description,
      element_id: element.element_id || '',
      acronym: element.acronym,
      model: element.model,
      providerId: element.providerId,
      locality: element.locality,
      centralId: element.centralId,
      floor: element.floor || '',
      hall: element.hall || '',
      isActive: element.isActive
    });

    // Si hay central, cargarla para mostrar en el selector
    if (element.central) {
      this.selectedCentral.set(element.central);
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/network-elements']);
  }

onSubmit(): void {
  if (this.networkElementForm.invalid) {
    Swal.fire({
      title: 'Error',
      text: 'Por favor complete todos los campos requeridos correctamente',
      icon: 'error',
      showConfirmButton: false,
      timer: 1500,
    });
    this.networkElementForm.markAllAsTouched();
    return;
  }

  const formValue = this.networkElementForm.value;

  // Función helper para limpiar valores null/undefined
  const cleanValue = (value: any): any => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return value;
  };

  const networkElementLike: Partial<NetworkElement> = {
    groupId: Number(formValue.groupId),
    platformId: Number(formValue.platformId),
    providerId: Number(formValue.providerId),
    centralId: Number(formValue.centralId),
    management_ip: cleanValue(formValue.management_ip),
    service_ip: cleanValue(formValue.service_ip),
    adsl_ip: cleanValue(formValue.adsl_ip),
    description: cleanValue(formValue.description),
    element_id: cleanValue(formValue.element_id),
    acronym: cleanValue(formValue.acronym),
    model: cleanValue(formValue.model),
    locality: cleanValue(formValue.locality),
    floor: cleanValue(formValue.floor),
    hall: cleanValue(formValue.hall),
    isActive: formValue.isActive ?? true
  };

  this.networkElementsService.updateNetworkElement(this.elementId(), networkElementLike).subscribe({
    next: (networkElement) => {
      Swal.fire({
        title: '¡Éxito!',
        text: 'El elemento de red se actualizó correctamente',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
      });
      this.router.navigate(['/admin/network-elements']);
    },
    error: (error) => {
      console.error('Error updating network element:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el elemento de red. Por favor, intente nuevamente.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
    }
  });
}

  onCentralSelected(central: Central): void {
    this.selectedCentral.set(central);
    this.networkElementForm.patchValue({
      centralId: central.id,
      locality: central.central_name
    });
    this.showCentralSelector.set(false);
  }

  hasError(controlName: string): boolean {
    const control = this.networkElementForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.networkElementForm.get(controlName);
    if (control?.errors?.['required']) {
      return 'Este campo es requerido';
    }
    if (control?.errors?.['min'] || control?.errors?.['minLength']) {
      return 'Debe seleccionar una opción válida';
    }
    return '';
  }
}
