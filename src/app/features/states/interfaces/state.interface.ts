import { Region } from "@features/regions/interfaces/region.interface";

export interface State {
  id:          number;
  state:       string;
  isActive:    boolean;
  createdDate: Date;
  updatedDate: Date;
  regionId:    number;
  region:      Region;
}
