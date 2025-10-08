/* users/dto/change-username-internal.dto.ts */
export class ChangeUsernameInternalDto {
  oldUsername: string;
  newUsername: string;
  newPlainPassword: string;
  deleteOld?: boolean;
}
