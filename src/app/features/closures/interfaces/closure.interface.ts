import { User } from "@auth/interfaces/user.interface";
import { FiberLength } from "@features/fiber-lengths/interfaces/fiber-length.interface";
import { Group } from "@features/groups/interfaces/group.interface";
import { IncidentDetails } from "@features/incidents-details/interfaces/incident-details.interface";
import { Incident } from "@features/incidents/interfaces/incidents.interface";
import { NetworkElement } from "@features/network-elements/interfaces/network-element.interface";
import { Ticket } from "@tickets/interfaces/ticket.interface";

export interface CreateClosureDto {
  id_ticket: number;
  date_hlls: string;
  date_hir: string;
  date_hrs: string;
  date_hff: string;
  impacto_inter_bbip: number;
  impacto_abon_voz: number;
  impacto_ptos_aba: number;
  impacto_inter_me: number;
  impacto_circuitos: number;
  impacto_intercon: number;
  action_taken: string;
  groupId: number;
  networkElementIds?: number[]; // ✅ NUEVO - array para elementos afectados
  networkElementClosureIds?: number[]; // ✅ NUEVO - array para elementos cierre
  fiberLengthId?: number;
  incidentId: number;
  incidentDetailId: number;
  isActive?: boolean;
}

export interface Closure {
  id: number;
  id_ticket: number;
  date_hlls: Date;
  date_hir: Date;
  date_hrs: Date;
  date_hff: Date;
  impacto_inter_bbip: number;
  impacto_abon_voz: number;
  impacto_ptos_aba: number;
  impacto_inter_me: number;
  impacto_circuitos: number;
  impacto_intercon: number;
  groupId: number;
  fiberLengthId?: number;
  incidentId: number;
  incidentDetailId: number;
  action_taken: string;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
  group: Group;
  incident: Incident;
  incidentDetail: IncidentDetails;
  network_element: NetworkElement[]; // ✅ NUEVO - array para elementos afectados
  network_element_closure: NetworkElement[]; // ✅ NUEVO - array para elementos cierre
  fiber_length?: FiberLength;
  ticket: Ticket;
  user: User;
}
