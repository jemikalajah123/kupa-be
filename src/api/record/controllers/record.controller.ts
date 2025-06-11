import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { Record } from '../schemas';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos';
import { RecordCategory, RecordFormat } from '../schemas';
import { UpdateRecordRequestDTO } from '../dtos';
import { RecordService } from '../services';
import { IApiResponse } from 'src/shared/types';
import { GetRecordsQueryDto } from '../dtos';

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createRecord(@Body() request: CreateRecordRequestDTO): Promise<IApiResponse> {
    return this.recordService.createRecord(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async updateRecord(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<IApiResponse> {
    return this.recordService.updateRecord(id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name',
    type: String,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
    type: String,
  })
  async findAllRecords(
    @Query() query: GetRecordsQueryDto = {} as GetRecordsQueryDto,
  ): Promise<IApiResponse> {
    const { q, artist, album, format, category, page, limit } = query;
    const validatedFormat = Object.values(RecordFormat).includes(
      format as RecordFormat,
    )
      ? (query.format as RecordFormat)
      : undefined;

    const validatedCategory = Object.values(RecordCategory).includes(
      category as RecordCategory,
    )
      ? (category as RecordCategory)
      : undefined;

    return this.recordService.findAllRecords(
      q,
      artist,
      album,
      validatedFormat,
      validatedCategory,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a record by ID' })
  @ApiResponse({ status: 200, description: 'Record found successfully', type: Record })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async getRecordById(@Param('id') id: string): Promise<IApiResponse> {
    return this.recordService.getRecordById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a record by ID' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async deleteRecord(@Param('id') id: string): Promise<IApiResponse> {
    return this.recordService.deleteRecord(id);
  }
}
