import { CommonModule } from '@angular/common';
import { Component, inject, Input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Central } from '@features/centrals/interfaces/central.interface';
import { StatesService } from '@features/states/services/states.service';

@Component({
  selector: 'central-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './central-form.component.html',
})
export class CentralFormComponent {
  private fb = inject(FormBuilder);
  private statesService = inject(StatesService);

  @Input() set central(value: Central | null) {
    if (value) {
      this.form.patchValue({
        central_code: value.central_code,
        central_name: value.central_name,
        stateId: value.stateId.toString(), // Convertir number a string
        observations: value.observations,
        coord_lat: value.coord_lat,
        coord_lng: value.coord_lng
      });
      this.isEditMode = true;
    } else {
      this.form.reset({
        stateId: ''
      });
      this.isEditMode = false;
    }
  }

  @Input() isEdit = false;
  saved = output<any>();
  cancelled = output<void>();

  states = this.statesService.getStates();
  isEditMode = false;
  submitted = false;

  form = this.fb.group({
    central_code: ['', [Validators.required, Validators.minLength(1)]],
    central_name: ['', [Validators.required, Validators.minLength(1)]],
    stateId: ['', [Validators.required]], // Mantener como string en el formulario
    observations: [''],
    coord_lat: [''],
    coord_lng: ['']
  });

  onSubmit() {
    this.submitted = true;

    if (this.form.valid) {
      // Convertir stateId de string a number antes de enviar
      const formData = {
        ...this.form.value,
        stateId: Number(this.form.value.stateId) // Conversión aquí
      };

      // Limpiar datos vacíos
      if (!formData.observations) formData.observations = '';
      if (!formData.coord_lat) formData.coord_lat = '';
      if (!formData.coord_lng) formData.coord_lng = '';

      this.saved.emit(formData);
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.cancelled.emit();
  }

  // Método para verificar si un campo tiene error
  hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.touched || this.submitted)
    );
  }

  // Método para obtener mensaje de error
  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);

    if (control?.errors?.['required']) {
      return 'Este campo es requerido';
    }

    if (control?.errors?.['minlength']) {
      return 'Debe tener al menos 1 carácter';
    }

    return '';
  }
}
