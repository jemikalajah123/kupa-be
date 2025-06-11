import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { IDecodedJwtToken } from './types';
import { JWT_TOKEN_TYPE } from '../constants';

export class JwtAccessTokenStrategy extends PassportStrategy(
  Strategy,
  JWT_TOKEN_TYPE.ACCESS_TOKEN,
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;

          if (req && req.cookies) {
            token = req.cookies['accessToken']; // Cookie extraction
          }

          if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1]; // Header extraction
          }

          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: 'test-key', // TODO: change to envConfig.JWT_ACCESS_TOKEN_SECRET
    });
  }

  validate(decodedToken: IDecodedJwtToken) {
    return decodedToken;
  }
}
