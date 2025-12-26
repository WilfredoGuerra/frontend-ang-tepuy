import { User } from '@auth/interfaces/user.interface';
import { Failure } from '@features/failures/interfaces/failure.interface';
import { FiberLength } from '@features/fiber-lengths/interfaces/fiber-length.interface';
import { Group } from '@features/groups/interfaces/group.interface';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';
import { Origin } from '@features/origins/interfaces/origin.interface';
import { PersonalRegion } from '@features/personal-region/interfaces/personal-region.interface';
import { Platform } from '@features/platforms/interfaces/platform.interface';
import { Severity } from '@features/severities/interfaces/severity.interface';
import { Status } from '@features/statuses/interfaces/status.interface';
import { Ticket } from '@tickets/interfaces/ticket.interface';

export interface ProgressTicketResponse {
  // count: number;
  // pages: number;
  // progressTicket: ProgressTicket[];
  data: ProgressTicket[]; // ✅ CAMBIAR de 'progressTicket' a 'data'
  count: number;
  pages: number;
  limit: number;
  offset: number;
}

export interface ProgressTicket {
  id: number;
  assignedUserId?: number;
  ticketId: number;
  progress: string;
  observations: string;
  groupId: number;
  severityId: number;
  statusId: number;
  platformId: number;
  originId: number;
  failureId: number;
  impact?: string;
  personalRegionId: number;
  fiberLengthId?: number;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
  images?: string[];

  // Relaciones
  ticket?: Ticket;
  user?: User; // Usuario que creó el registro
  assignedUser?: User; // Usuario asignado
  personal_region?: PersonalRegion; // Personal de región asignado
  group?: Group;
  severity?: Severity;
  status?: Status;
  platform?: Platform;
  origin?: Origin;
  failure?: Failure;
  network_elements?: NetworkElement[];
  fiberLength?: FiberLength;
}
