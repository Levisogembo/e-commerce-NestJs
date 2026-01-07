import { Roles } from 'src/roles/dtos/enums/roles.enum';

export class jwtPayloadDto {
  userId: string;
  email: string;
  role: Roles;
  iat: number;
  exp: number;
}
