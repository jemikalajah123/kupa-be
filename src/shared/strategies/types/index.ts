import { USER_ROLE } from '../../constants';

export interface IDecodedJwtToken {
  id: number; //userId
  role: USER_ROLE;
}
