import { User } from "@auth/interfaces/user.interface";


export interface Team {
  id:             number;
  team_name:      string;
  team_code:      string;
  entry_time:     string;
  departure_time: string;
  isActive:       boolean;
  createdDate:    Date;
  updatedDate:    Date;
  user?:          User[];
}

