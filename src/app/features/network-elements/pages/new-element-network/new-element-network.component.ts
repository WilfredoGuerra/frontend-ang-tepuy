import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
import { Group } from '@features/groups/interfaces/group.interface';
import { Platform } from '@features/platforms/interfaces/platform.interface';
import { Provider } from '@features/providers/interfaces/provider.interface';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'new-element-network',
  imports: [ReactiveFormsModule, CentralsPageComponent],
  templateUrl: './new-element-network.component.html',
})
export class NewElementNetworkComponent {
  // Services
  private fb = inject(FormBuilder);
  private networkElementsService = inject(NetworkElementsService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private modalService = inject(ModalService);
  private groupsService = inject(GroupsService);
  private platformsService = inject(PlatformsService);
  private providersService = inject(ProvidersService);

  // Signals
  showCentralSelector = signal(false);
  selectedCentral = signal<Central | null>(null);

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

  onCancel(): void {
    this.modalService.close();
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

  const networkElementLike: Partial<NetworkElement> = {
    groupId: Number(formValue.groupId),
    platformId: Number(formValue.platformId),
    providerId: Number(formValue.providerId),
    centralId: Number(formValue.centralId),
    management_ip: formValue.management_ip ?? undefined,
    service_ip: formValue.service_ip ?? undefined,
    adsl_ip: formValue.adsl_ip ?? undefined,
    description: formValue.description ?? undefined,
    element_id: formValue.element_id ?? undefined,
    acronym: formValue.acronym ?? undefined,
    model: formValue.model ?? undefined,
    locality: formValue.locality ?? undefined,
    floor: formValue.floor ?? undefined,
    hall: formValue.hall ?? undefined,
    isActive: formValue.isActive ?? true
  };

  this.networkElementsService.createNetworkElement(networkElementLike).subscribe({
    next: (networkElement) => {
      Swal.fire({
        title: '¡Éxito!',
        text: 'El elemento de red se creó correctamente',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
      });
      this.modalService.close();
      this.router.navigate(['/admin/network-elements']);
    },
    error: (error) => {
      console.error('Error creating network element:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el elemento de red. Por favor, intente nuevamente.',
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

  // Helper methods for form validation
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

  // Helper to find ID from name for selects
  findIdByName<T extends { id: number }>(items: T[], name: string, nameField: keyof T): number {
    const item = items.find(item => item[nameField] === name);
    return item ? item.id : 0;
  }
}
