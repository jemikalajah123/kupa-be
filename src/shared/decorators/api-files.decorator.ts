import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { multerOptions } from '../config';

export function ApiFiles(
  fieldName: string = 'files',
  required: boolean = false,
  maxCount: number = 10,
) {
  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount, multerOptions)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),
  );
}
