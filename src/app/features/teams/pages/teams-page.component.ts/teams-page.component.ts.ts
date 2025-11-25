import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/services/auth.service';
import { TeamCard } from '@features/teams/components/team-card/team-card.js';
import { Team } from '@features/teams/interfaces/team.interface';
import { ShortNamePipe } from '@features/teams/pipes/short-name.pipe';
import { SortByIdPipe } from '@features/teams/pipes/sort-by-id.pipe';
import { TeamsService } from '@features/teams/services/teams.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-teams-page.component.ts',
  imports: [TeamCard, SortByIdPipe],
  templateUrl: './teams-page.component.ts.html',
})
export class TeamsPageComponentTs {
  teamsService = inject(TeamsService);
  usersService = inject(AuthService);

  teamsResource = rxResource({
    params: () => ({}),
    stream: ({ params }) => {
      return this.teamsService.getTeams();
    },
  });

  usersResource = rxResource({
    params: () => ({ limit: 200 }),
    stream: ({ params }) => {
      return this.usersService
        .getUsers({ limit: params.limit })
        // .pipe(tap((user) => console.log({ user })));
    },
  });

  // getCoordinates() {
  //   return this.usersResource.value()?.users.filter(
  //     (user) =>
  //       (user.group === null || user.group === undefined) &&
  //       user.position?.id === 4
  //   );
  // }

  getAllCoordinates(): any[] {
    const users = this.usersResource.value()?.users;
    if (!users) return [];

    return users.filter(
      (user) =>
        (user.group === null || user.group === undefined) &&
        user.position?.id === 4 &&
        user.coordinationId === 1
      //  user.position?.position?.toLowerCase().includes('coordinador')
    );
  }

getLeadersByPositionAndGroup(): any[] {
  const users = this.usersResource.value()?.users;

  if (!users || !Array.isArray(users)) {
    return [];
  }

  return users.filter((user) => {
    if (!user || !user.position || !user.group) {
      return false;
    }

    // Verificar position por ID o por nombre
    const hasCorrectPosition =
      user.position.id === 22 ||
      user.position.position?.toLowerCase().includes('lider');

    // Verificar que group.id esté entre 1 y 6
    const hasValidGroup = user.group.id >= 1 && user.group.id <= 6;

    const hasValidCoordination = user.coordinationId !== 9;

    return hasCorrectPosition && hasValidGroup && hasValidCoordination;
  }).map(leader => {
    // Agregar la actividad según el grupo
    return {
      ...leader,
      actividad: this.getActividadByGroup(leader.group.id)
    };
  });
}

getActividadByGroup(groupId: number): string {
  const actividades: { [key: number]: string } = {
    1: 'Sup. Plataforma Cx.',
    2: 'Sup. Plataforma Tx.',
    3: 'Sup. Plataforma Red de Datos Y Proyecto CNE',
    4: 'Sup. Plataforma Ip.',
    5: 'Sup. Plataforma Servicios TI.',
    6: 'Por definir'
  };

  return actividades[groupId] || 'Actividad no definida';
}
}
