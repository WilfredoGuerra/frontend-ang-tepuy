import { Municipality } from "@features/municipalities/interfaces/municipality.interface";

export interface Parish {
  id:             number;
  parish:         string;
  municipalityId: number;
  isActive:       boolean;
  createdDate:    Date;
  updatedDate:    Date;
  municipality:   Municipality;
}
