import { Reflector } from '@nestjs/core';
import { USER_ROLE } from '../constants';

export const Roles = Reflector.createDecorator<USER_ROLE[]>();
