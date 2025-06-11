import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_TOKEN_TYPE } from '../constants';

@Injectable()
export class JwtAccessTokenGuard extends AuthGuard(
  JWT_TOKEN_TYPE.ACCESS_TOKEN,
) {
  constructor() {
    super();
  }
}
