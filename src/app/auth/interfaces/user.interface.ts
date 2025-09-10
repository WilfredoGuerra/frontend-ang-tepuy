import { Group } from "@features/groups/interfaces/group.interface";
import { Position } from "@features/positions/interfaces/position.interface";
import { Team } from "@features/teams/interfaces/team.interface";

export interface UserResponse {
  count:            number;
  pages:            number;
  users: User[];
}

// export interface User {
//   id:       number;
//   email:    string;
//   fullName: string;
//   isActive: boolean;
//   roles:    string[];
//   group:    Group;
//   position: Position;
//   team:     Team;
// }

export interface User {
  id:                    number;
  cedula:                string;
  email:                 string;
  fullName:              string;
  surnames:              string;
  isActive:              boolean;
  roles:                 string[];
  p00:                   string;
  date_birthday:         Date;
  gender:                string;
  personalEmail:         string;
  officePhone:           string;
  personalPhone:         string;
  company_entry_date:    Date;
  management_entry_date: Date;
  full_address:          string;
  coordinationId:        number;
  group?:               number;
  position:            number;
  team?:                number;
  parishId:              number;
  level_education:       number[];
}
