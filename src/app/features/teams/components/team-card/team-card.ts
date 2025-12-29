import { Component, input } from '@angular/core';
import { Team } from '@features/teams/interfaces/team.interface';
import { ShortNamePipe } from '@features/teams/pipes/short-name.pipe';

@Component({
  selector: 'team-card',
  imports: [ShortNamePipe],
  templateUrl: './team-card.html',
})
export class TeamCard {
  team = input.required<Team>();

  // getUsersWithGroup(users: any[]): any[] {
  //   return users
  //     .filter((user) => user.group !== null && user.group !== undefined)
  //     .sort((a, b) => {
  //       // Ordenar alfabéticamente por el nombre del grupo (especialidad)
  //       const groupA = a.group?.group?.toLowerCase() || '';
  //       const groupB = b.group?.group?.toLowerCase() || '';
  //       return groupA.localeCompare(groupB);
  //     });
  // }

  getUsersWithGroup(users: any[]): any[] {
    // Define el orden específico que deseas
    const specificOrder = [
      'conmutación',
      'transmisión',
      'red de datos',
      'redes ip',
      'servicios ti',
      'energía',
    ];

    return users
      .filter((user) => user.group !== null && user.group !== undefined)
      .sort((a, b) => {
        const groupA = a.group?.group?.toLowerCase() || '';
        const groupB = b.group?.group?.toLowerCase() || '';

        const indexA = specificOrder.indexOf(groupA);
        const indexB = specificOrder.indexOf(groupB);

        // Si ambos grupos están en la lista de orden específico
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Si solo uno está en la lista, ponerlo primero
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Si ninguno está en la lista, orden alfabético normal
        return groupA.localeCompare(groupB);
      });
  }

  getTeamLeader(users: any[]): any {
    return users.find(
      (user) =>
        (user.group === null || user.group === undefined) &&
        user.position?.id === 22 // O user.position?.position === 'Líder'
    );
  }

  getTipoJornada(entryTime: string, departureTime: string): string {
    if (!entryTime || !departureTime) return '--';

    const entryHour = parseInt(entryTime.split(':')[0]);
    const departureHour = parseInt(departureTime.split(':')[0]);

    // Jornada Diurna: 07:00 - 13:30
    if (entryHour === 7 && departureHour === 13) {
      return 'Jornada Diurna';
    }

    // Jornada Mixta: 13:00 - 19:30
    if (entryHour === 13 && departureHour === 19) {
      return 'Jornada Mixta';
    }

    // Si no coincide con los horarios definidos, determinar por la hora de entrada
    if (entryHour >= 6 && entryHour < 12) {
      return 'Jornada Diurna';
    } else if (entryHour >= 12 && entryHour < 18) {
      return 'Jornada Mixta';
    } else {
      return 'Jornada Nocturna';
    }
  }

  getJornadaBadgeClass(entryTime: string, departureTime: string): string {
    if (!entryTime || !departureTime) return 'badge-neutral';

    const entryHour = parseInt(entryTime.split(':')[0]);
    const departureHour = parseInt(departureTime.split(':')[0]);

    // Jornada Diurna: 07:00 - 13:30
    if (entryHour === 7 && departureHour === 13) {
      return 'badge-success';
    }

    // Jornada Mixta: 13:00 - 19:30
    if (entryHour === 13 && departureHour === 19) {
      return 'badge-warning';
    }

    // Si no coincide con los horarios definidos
    if (entryHour >= 6 && entryHour < 12) {
      return 'badge-success';
    } else if (entryHour >= 12 && entryHour < 18) {
      return 'badge-warning';
    } else {
      return 'badge-error';
    }
  }
}
