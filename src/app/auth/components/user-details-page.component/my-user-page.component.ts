import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { User } from '@auth/interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { UserImagePipe } from '@auth/pipes/user-image.pipe';
import { FormatCedulaPipe } from '@auth/pipes/format-cedula.pipe';
import { LevelsEducationService } from '@features/level-education/services/levels-education.service';
import { LevelEducation } from '@features/level-education/interfaces/level-education.interface';
import Swal from 'sweetalert2';
import { ChangePasswordModalComponent } from './change-password-modal.component';

@Component({
  selector: 'app-my-user-page',
  templateUrl: './my-user-page.component.html', // ← USAR LA NUEVA PLANTILLA
  imports: [
    CommonModule,
    UserImagePipe,
    FormatCedulaPipe,
    ChangePasswordModalComponent // ← Agregar el modal
  ],
})
export class MyUserPageComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private levelsEducationService = inject(LevelsEducationService);

  @ViewChild(ChangePasswordModalComponent) changePasswordModal!: ChangePasswordModalComponent;

  // Señales
  user = signal<User | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  allLevelsEducation = signal<LevelEducation[]>([]);

  ngOnInit(): void {
    this.loadEducationLevels();
    this.loadCurrentUser();
  }

  loadEducationLevels(): void {
    this.levelsEducationService.getLevelsEducation().subscribe({
      next: (levels) => {
        this.allLevelsEducation.set(levels);
      },
      error: (err) => {
        console.error('Error cargando niveles educativos:', err);
      },
    });
  }

  loadCurrentUser(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.error.set('No se pudo cargar tu información');
        this.isLoading.set(false);

        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar tu información de usuario',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.router.navigate(['/dashboard']);
        });
      },
    });
  }

  // Métodos de formateo (copiados de user-details-page)
  formatDate(dateString: Date | string | undefined | null): string {
    if (!dateString || dateString === '') return 'No especificada';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
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

  getParishName(): string {
    const userData = this.user();
    if (!userData) return 'No especificada';
    if (userData.parish?.parish) return userData.parish.parish;
    return userData.parishId ? `ID: ${userData.parishId}` : 'No especificada';
  }

  getCoordinationName(): string {
    const userData = this.user();
    if (!userData) return 'No asignada';
    if (userData.coordination?.coordination) return userData.coordination.coordination;
    return userData.coordinationId ? `ID: ${userData.coordinationId}` : 'No asignada';
  }

  getTeamName(): string {
    const userData = this.user();
    if (!userData) return 'No asignado';
    if (userData.team?.team_name) return userData.team.team_name;
    return 'No asignado';
  }

  getGroupName(): string {
    const userData = this.user();
    if (!userData) return 'No asignado';
    if (userData.group?.group) return userData.group.group;
    return 'No asignado';
  }

  getPositionName(): string {
    const userData = this.user();
    if (!userData) return 'Sin cargo';
    if (userData.position?.position) return userData.position.position;
    return 'Sin cargo';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  canEdit(): boolean {
    const currentUser = this.authService.user();
    return currentUser?.roles?.includes('super_user') || false;
  }

  editUser(): void {
    if (this.user()) {
      this.router.navigate(['/admin/auth/users/edit', this.user()!.id]);
    }
  }

  changePassword(): void {
    this.changePasswordModal.openModal();
  }

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

  getLevelEducationNamesString(): string {
    const names = this.getLevelEducationNames();
    return names.length > 0 ? names.join(', ') : 'No especificados';
  }
}
