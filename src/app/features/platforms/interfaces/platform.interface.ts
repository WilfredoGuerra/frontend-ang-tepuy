import { Group } from "@features/groups/interfaces/group.interface";

export interface Platform {
  id:          number;
  platform:    string;
  isActive:    boolean;
  createdDate: Date;
  updatedDate: Date;
  groups:      Group[];
}
