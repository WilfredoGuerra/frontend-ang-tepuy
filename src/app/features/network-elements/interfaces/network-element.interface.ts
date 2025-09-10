import { Central } from "@features/centrals/interfaces/central.interface";
import { Group } from "@features/groups/interfaces/group.interface";
import { Platform } from "@features/platforms/interfaces/platform.interface";
import { Provider } from "@features/providers/interfaces/provider.interface";


export interface NetworksElement {
  count:            number;
  pages:            number;
  networksElements: NetworkElement[];
}

export interface NetworkElement {
  id:            number;
  groupId:       number;
  platformId:    number;
  management_ip: string;
  service_ip:    string;
  adsl_ip:       string;
  description:   string;
  element_id:    string;
  acronym:       string;
  model:         string;
  providerId:    number;
  locality:      string;
  centralId:     number;
  floor:         string;
  hall:          string;
  isActive:      boolean;
  createdDate:   Date;
  updatedDate:   Date;

  central?:       Central;
  platform?:      Platform;
  group?:         Group;
  provider?:      Provider;
}
