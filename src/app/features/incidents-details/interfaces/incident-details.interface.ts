import { Incident } from "@features/incidents/interfaces/incidents.interface";

export interface IncidentDetails {
  id:              number;
  inc_detail_name: string;
  incidentId:      number;
  isActive:        boolean;
  createdDate:     Date;
  updatedDate:     Date;
  incident_name?:  Incident;
}
