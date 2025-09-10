import { State } from "@features/states/interfaces/state.interface";

export interface FiberLengthsResponse {
  count:            number;
  pages:            number;
  fiberLengths: FiberLength[];
}

export interface FiberLength {
  id:           number;
  locality_a:   string;
  locality_b:   string;
  stateA: State;
  stateB: State;
  section_name: string;
  isActive:     boolean;
  createdDate:  Date;
  updatedDate:  Date;
}
