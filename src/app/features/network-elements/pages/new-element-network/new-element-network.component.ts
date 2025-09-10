import { Component, inject, input } from '@angular/core';
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

@Component({
  selector: 'new-element-network',
  imports: [ReactiveFormsModule, CentralsPageComponent],
  templateUrl: './new-element-network.component.html',
})
export class NewElementNetworkComponent {
  // network = input.required<NetworkElement>();
  fb = inject(FormBuilder);
  networkElementsService = inject(NetworkElementsService);
  router = inject(Router);
  authService = inject(AuthService);
  modalService = inject(ModalService);

  groupsService = inject(GroupsService);
  platformsService = inject(PlatformsService);
  providersService = inject(ProvidersService);

  networkElementForm = this.fb.group({
    groupId: [0, Validators.required],
    platformId: [0, Validators.required],
    management_ip: ['', Validators.required],
    service_ip: ['', Validators.required],
    adsl_ip: ['', Validators.required],
    description: ['', Validators.required],
    element_id: ['', Validators.required],
    acronym: ['', Validators.required],
    model: ['', Validators.required],
    providerId: [0, Validators.required],
    locality: ['', Validators.required],
    centralId: [0, Validators.required],
    floor: ['', Validators.required],
    hall: ['', Validators.required],
  });

  onCancel() {
    // Usar el servicio para cerrar el modal
    this.modalService.close();
  }

  onSubmit() {
    const isValid = this.networkElementForm.valid;
    console.log(this.networkElementForm.value, { isValid });

    if (!isValid) {
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
    if (this.networkElementForm.valid) {
      Swal.fire({
        title: 'Éxito',
        text: 'El elemento de red se creó correctamente',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
      });
    }

    const formValue = this.networkElementForm.value;

    const networkElementLike: Partial<NetworkElement> = {
      ...(formValue as any),
    };

    this.networkElementsService
      .createNetworkElement(networkElementLike)
      .subscribe((networkElement) => {
        console.log('Elemento creado:', networkElement);
        this.modalService.close();
        this.router.navigate(['/admin/tickets']);
      });
  }

  groupsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.groupsService.getGroups();
    },
  });

  platformsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.platformsService.getPlatforms();
    },
  });

  providersResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.providersService.getProviders();
    },
  });
}
