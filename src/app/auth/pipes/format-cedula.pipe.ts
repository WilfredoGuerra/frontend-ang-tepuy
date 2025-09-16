import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCedula',
  standalone: true
})
export class FormatCedulaPipe implements PipeTransform {
  transform(cedula: string): string {
    if (!cedula) return '';

    // Limpiar cualquier formato existente
    const cleanCedula = cedula.replace(/\./g, '');

    // Verificar longitud y aplicar formato
    if (cleanCedula.length === 8) {
      // Formato para 8 dígitos: XX.XXX.XXX
      return `${cleanCedula.substring(0, 2)}.${cleanCedula.substring(2, 5)}.${cleanCedula.substring(5, 8)}`;
    } else if (cleanCedula.length === 7) {
      // Formato para 7 dígitos: X.XXX.XXX
      return `${cleanCedula.substring(0, 1)}.${cleanCedula.substring(1, 4)}.${cleanCedula.substring(4, 7)}`;
    }

    // Si no tiene 7 u 8 dígitos, devolver sin formato
    return cedula;
  }
}
