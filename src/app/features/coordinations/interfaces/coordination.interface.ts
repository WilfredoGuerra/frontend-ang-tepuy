import { Headquarter } from "@features/headquarters/interfaces/headquarter.interface";

export interface Coordination {
  id:            number;
  headquarterId: number;
  coordination:  string;
  isActive:      boolean;
  createdDate:   Date;
  updatedDate:   Date;
  headquarter:   Headquarter;
}
