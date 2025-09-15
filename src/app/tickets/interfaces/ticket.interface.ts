import { User } from "@auth/interfaces/user.interface";
import { Failure } from "@features/failures/interfaces/failure.interface";
import { FiberLength } from "@features/fiber-lengths/interfaces/fiber-length.interface";
import { Group } from "@features/groups/interfaces/group.interface";
import { NetworkElement } from "@features/network-elements/interfaces/network-element.interface";
import { Origin } from "@features/origins/interfaces/origin.interface";
import { PersonalRegion } from "@features/personal-region/interfaces/personal-region.interface";
import { Platform } from "@features/platforms/interfaces/platform.interface";
import { Severity } from "@features/severities/interfaces/severity.interface";
import { Status } from "@features/statuses/interfaces/status.interface";


export interface TicketsResponse {
  count:   number;
  pages:   number;
  tickets: Ticket[];
}

export interface Ticket {
  id_ticket:          number;
  nro_ticket:         string;

  groupId:            number;
  severityId:         number;
  statusId:           number;
  platformId:         number;
  originId:           number;
  failureId:          number;
  personalRegionId:   number;
  fiberLengthId?:      number;

  date_hif:           Date;
  date_hdc?:           Date;
  date_hct?:           Date;
  form_open_date?:     Date;

  definition_problem: string;
  evidences_problem?:  string;
  hypothesis:         string;
  impact?:             string;

  isActive:           boolean;
  createdDate:        Date;
  updatedDate:        Date;

  group?:              Group;
  severity?:           Severity;
  status?:             Status;
  platform?:           Platform;
  origin?:             Origin;
  failure?:            Failure;
  personal_region?:    PersonalRegion;
  fiber_length?:       FiberLength;
  formOpenDate?: string;
  user?:               User;

  network_elements?:   NetworkElement[];
  images?: string[];
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


