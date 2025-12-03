import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { User } from '@auth/interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { UserImagePipe } from '@auth/pipes/user-image.pipe';
import { FormatCedulaPipe } from '@auth/pipes/format-cedula.pipe';
import Swal from 'sweetalert2';
import { LevelsEducationService } from '@features/level-education/services/levels-education.service';
import { LevelEducation } from '@features/level-education/interfaces/level-education.interface';

@Component({
  selector: 'app-user-details-page',
  templateUrl: './user-details-page.component.html',
  imports: [CommonModule, UserImagePipe, FormatCedulaPipe],
})
export class UserDetailsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);
  levelsEducationService = inject(LevelsEducationService);

  // Señales
  userId = signal<number>(0);
  user = signal<User | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  allLevelsEducation = signal<LevelEducation[]>([]);

  ngOnInit(): void {
    this.loadEducationLevels();
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      if (id && !isNaN(id)) {
        this.userId.set(id);
        this.loadUserData(id);
      } else {
        this.error.set('ID de usuario inválido');
        this.isLoading.set(false);
      }
    });
  }

  loadEducationLevels(): void {
    this.levelsEducationService.getLevelsEducation().subscribe({
      next: (levels) => {
        this.allLevelsEducation.set(levels);
      },
      error: (err) => {
        console.error('Error cargando niveles educativos:', err);
        // Continuar aunque falle, mostrará IDs
      },
    });
  }

  loadUserData(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.getUserById(id).subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.error.set('No se pudo cargar la información del usuario');
        this.isLoading.set(false);

        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.router.navigate(['/admin/auth/users']);
        });
      },
    });
  }

  formatDate(dateString: Date | string | undefined | null): string {
    // Manejar null, undefined, o string vacío
    if (!dateString || dateString === '') return 'No especificada';

    try {
      const date = new Date(dateString);

      // Validar que sea una fecha válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Error formateando fecha:', dateString, error);
      return 'Fecha inválida';
    }
  }

  formatRoles(roles: string[]): string {
    if (!roles || roles.length === 0) return 'Usuario';

    const roleMap: { [key: string]: string } = {
      super_user: 'Super Usuario',
      admin: 'Administrador',
      security_admin: 'Admin de Seguridad',
      room_user: 'Usuario de Sala',
      user: 'Usuario Básico',
    };

    return roles.map((role) => roleMap[role] || role).join(', ');
  }

  // Métodos helper para acceder a propiedades anidadas de forma segura
  getParishName(): string {
    const userData = this.user();
    if (!userData) return 'No especificada';

    if (userData.parish?.parish) {
      return userData.parish.parish;
    }
    return userData.parishId ? `ID: ${userData.parishId}` : 'No especificada';
  }

  getCoordinationName(): string {
    const userData = this.user();
    if (!userData) return 'No asignada';

    if (userData.coordination?.coordination) {
      return userData.coordination.coordination;
    }
    return userData.coordinationId
      ? `ID: ${userData.coordinationId}`
      : 'No asignada';
  }

  getTeamName(): string {
    const userData = this.user();
    if (!userData) return 'No asignado';

    if (userData.team?.team_name) {
      return userData.team.team_name;
    }
    return 'No asignado';
  }

  getGroupName(): string {
    const userData = this.user();
    if (!userData) return 'No asignado';

    if (userData.group?.group) {
      return userData.group.group;
    }
    return 'No asignado';
  }

  getPositionName(): string {
    const userData = this.user();
    if (!userData) return 'Sin cargo';

    if (userData.position?.position) {
      return userData.position.position;
    }
    return 'Sin cargo';
  }

  goBack(): void {
    this.router.navigate(['/admin/auth/users']);
  }

  editUser(): void {
    if (this.user()) {
      this.router.navigate(['/admin/auth/users/edit', this.userId()]);
    }
  }

  // NUEVO MÉTODO: Obtener nombres de niveles educativos
  getLevelEducationNames(): string[] {
    const userData = this.user();
    const allLevels = this.allLevelsEducation();

    if (!userData?.level_education || userData.level_education.length === 0) {
      return [];
    }

    return userData.level_education.map((levelId) => {
      const level = allLevels.find((l) => l.id === levelId);
      return level ? level.levelEducation : `Nivel ID: ${levelId}`;
    });
  }

  // Método para mostrar todos los nombres en un string
  getLevelEducationNamesString(): string {
    const names = this.getLevelEducationNames();
    return names.length > 0 ? names.join(', ') : 'No especificados';
  }
}
