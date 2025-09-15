export interface IRoleSearchResponse {
  itemsPerPage: number;
  Resources: IResource[];
  schemas: string[];
  startIndex: number;
  totalResults: number;
}

export interface IResource {
  audience: IAudience;
  displayName: string;
  meta: IMeta;
  permissions: IPermission[];
  groups: IGroup[];
  id: string;
  associatedApplications: IAssociatedApplication[];
  users: IUser[];
}

interface IAudience {
  display: string;
  type: string;
  value: string;
}

interface IMeta {
  location: string;
}

export interface IPermission {
  display: string;
  value: string;
  $ref: string;
}

interface IGroup {
  display: string;
  value: string;
  $ref: string;
}

interface IAssociatedApplication {
  value: string;
  $ref: string;
}

interface IUser {
  display: string;
  value: string;
  $ref: string;
}
