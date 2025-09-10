import { State } from "@features/states/interfaces/state.interface";

export interface Municipality {
  id:           number;
  municipality: string;
  stateId:      number;
  isActive:     boolean;
  createdDate:  Date;
  updatedDate:  Date;
  state:        State;
}
