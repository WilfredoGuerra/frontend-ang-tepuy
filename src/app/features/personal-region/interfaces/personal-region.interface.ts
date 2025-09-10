import { User } from "@auth/interfaces/user.interface";
import { GroupEscalatory } from "@features/group-escalatory/interfaces/group-escalatory.interface";
import { Position } from "@features/positions/interfaces/position.interface";
import { State } from "@features/states/interfaces/state.interface";


export interface PersonalsRegion {
  count:            number;
  pages:            number;
  personalsRegions: PersonalRegion[];
}

export interface PersonalRegion {
  id:                number;
  names:             string;
  surnames:          string;
  office_phone:      string;
  mobile_phone:      string;
  email:             string;
  inf_adicional:     string;
  isActive:          boolean;
  createdDate:       Date;
  updatedDate:       Date;
  states:            State[];
  groups_escalatory: GroupEscalatory[];
  position:          Position[];
  user:              User;
}
