import { State } from "@features/states/interfaces/state.interface";

export interface Headquarter {
  id:          number;
  stateId:     number;
  headquarter: string;
  isActive:    boolean;
  createdDate: Date;
  updatedDate: Date;
  state:       State;
}
