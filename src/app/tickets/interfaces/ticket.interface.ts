import { User } from '@auth/interfaces/user.interface';
import { Closure } from '@features/closures/interfaces/closure.interface';
import { Failure } from '@features/failures/interfaces/failure.interface';
import { FiberLength } from '@features/fiber-lengths/interfaces/fiber-length.interface';
import { Group } from '@features/groups/interfaces/group.interface';
import { NetworkElement } from '@features/network-elements/interfaces/network-element.interface';
import { Origin } from '@features/origins/interfaces/origin.interface';
import { PersonalRegion } from '@features/personal-region/interfaces/personal-region.interface';
import { Platform } from '@features/platforms/interfaces/platform.interface';
import { Severity } from '@features/severities/interfaces/severity.interface';
import { Status } from '@features/statuses/interfaces/status.interface';
import { PersonsPhoneReport } from './persons-phone-report.interface';

export interface TicketsResponse {
  count: number;
  pages: number;
  tickets: Ticket[];
}

export interface Ticket {
  id_ticket: number;
  nro_ticket: string;

  groupId: number;
  severityId: number;
  statusId: number;
  platformId: number;
  originId: number;
  failureId: number;
  personalRegionId: number;
  fiberLengthId?: number;

  date_hif: Date;
  date_hdc?: Date;
  date_hct?: Date;
  form_open_date?: Date;

  definition_problem: string;
  evidences_problem?: string;
  hypothesis: string;
  impact?: string;
  cancellation_note?: string;

  personPhoneReport?: PersonsPhoneReport;

  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;

  // NUEVO: Campos para tracking de cancelación
  cancelledById?: number;
  cancelledAt?: Date;
  cancelledBy?: User;

  group?: Group;
  severity?: Severity;
  status?: Status;
  platform?: Platform;
  origin?: Origin;
  failure?: Failure;
  personal_region?: PersonalRegion;
  fiber_length?: FiberLength;
  formOpenDate?: string;
  user?: User;

  network_elements?: NetworkElement[];
  images?: string[];

  closure?: Closure;
  closureId?: number;

  updatedBy?: User;
}

export interface SearchTicketCriteria {
  groupId?: number;
  severityId?: number;
  statusId?: number;
  platformId?: number;
  originId?: number;
  failureId?: number;
  definition_problem?: string;
  evidences_problem?: string;
  hypothesis?: string;
  createdDateStart?: string;
  createdDateEnd?: string;
  page?: number;
  limit?: number;
}

export interface CreateTicketResponse {
  id_ticket: number;
  nro_ticket: string;
}

export interface TicketHistory {
  id: number;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  action: string;
  changedFields: string;
  createdAt: Date;
  updatedBy: User;
  ticketId: number;
  ticket?: {
    id_ticket: number;
    nro_ticket: string;
  };
}

export interface TicketHistoryResponse {
  history: TicketHistory[];
  count: number;
  pages: number;
  currentPage?: number;
}

export interface TicketHistorySearchCriteria {
  ticketNumber?: string;
  updatedBy?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export interface TicketForm {
  groupId: number | null;
  severityId: number | null;
  platformId: number | null;
  originId: number | null;
  failureId: number | null;
  statusId: number | null;
  elementNetworkId: number[] | null;
  fiberLengthId: number | null;
  definition_problem: string;
  evidences_problem: string;
  hypothesis: string;
  personalRegionId: number | null;
  impact: string;
  date_hif: string;
  date_hdc: string | null;
  date_hct: string | null;
  personPhoneReport?: {
    name: string;
    phone: string;
  } | null;
}
