// import { Group } from '@features/groups/interfaces/group.interface';
// import { Position } from '@features/positions/interfaces/position.interface';
// import { Team } from '@features/teams/interfaces/team.interface';

// export interface UserResponse {
//   count: number;
//   pages: number;
//   users: User[];
// }
// export interface User {
//   id: number;
//   cedula: string;
//   email: string;
//   fullName: string;
//   surnames: string;
//   isActive: boolean;
//   roles: string[];
//   p00: string;
//   date_birthday: Date;
//   gender: string;
//   personalEmail: string;
//   officePhone: string;
//   personalPhone: string;
//   company_entry_date: Date;
//   management_entry_date: Date;
//   full_address: string;
//   coordinationId: number;
//   group: Group;
//   position: Position;
//   team?: Team;
//   parishId: number;
//   level_education: number[];
//   images?: string[];
//   password?: string;
//   levelEducationsIds?: number[];
// }


import { Group } from "@features/groups/interfaces/group.interface";
import { Position } from "@features/positions/interfaces/position.interface";
import { Coordination } from "@features/coordinations/interfaces/coordination.interface";
import { Parish } from "@features/parishes/interfaces/parish.interface";
import { Team } from "@features/teams/interfaces/team.interface";
import { LevelEducation } from "@features/level-education/interfaces/level-education.interface";

export interface UserResponse {
  count: number;
  pages: number;
  users: User[];
}

export interface User {
  // Información básica
  id: number;
  cedula: string;
  email: string;
  fullName: string;
  surnames: string;
  isActive: boolean;
  roles: string[];
  p00: string;

  // Datos personales
  date_birthday: Date | string;
  gender: string;
  personalEmail: string;
  officePhone: string;
  personalPhone: string;
  full_address: string;

  // Datos laborales
  company_entry_date: Date | string;
  management_entry_date: Date | string;
  coordinationId: number;
  group?: Group | null;
  position: Position;
  team?: Team | null;
  parishId: number;

  // Relaciones (vienen en algunas respuestas)
  level_education: number[]; // IDs de niveles educativos
  images?: string[];

  // Campos adicionales del backend
  createdDate?: Date | string;
  updatedDate?: Date | string;
  coordination?: Coordination;
  parish?: Parish;

  // Campos para formularios
  password?: string;
  levelEducationsIds?: number[];

  // Para debugging/propiedades adicionales
  [key: string]: any; // Para propiedades dinámicas que puedan venir
}
