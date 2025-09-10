import { State } from "@features/states/interfaces/state.interface";


// export interface Central {
//   id:           number;
//   stateId:      number;
//   central_code: string;
//   central_name: string;
//   observations: string;
//   coord_lat:    string;
//   coord_lng:    string;
//   isActive:     boolean;
//   createdDate:  Date;
//   updatedDate:  Date;
//   state:        State;
// }


export interface CentralsResponse {
  count: number;
  pages: number;
  centralLengths: Central[];
}

export interface Central {
  id: number;
  stateId: number;
  central_code: string;
  central_name: string;
  observations: string;
  coord_lat: string;
  coord_lng: string;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
  state: State;
}

