import {
  Injectable,
  Logger,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../schemas';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CreateRecordRequestDTO, UpdateRecordRequestDTO } from '../dtos';
import { IApiResponse } from '../../../shared/types';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { MusicBrainzService } from '../../third-party-services/musicbrainz';

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);

  constructor(
    @InjectModel(Record.name) private readonly recordModel: Model<Record>, // Inject the Record model
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Inject the cache manager
    private readonly musicBrainzService: MusicBrainzService, // Inject the MusicBrainz service
  ) {}

  async createRecord(request: CreateRecordRequestDTO): Promise<IApiResponse> {
    try {
      let tracklist: string[] = [];
      if (request.mbid) {
        tracklist = await this.musicBrainzService.fetchTracklist(request.mbid);
      }

      const record = await this.recordModel.create({
        ...request,
        tracklist,
      });

      return {
        status: true,
        message: 'Record created successfully',
        data: record,
      };
    } catch (error) {
      this.logger.error('Error creating record', error.stack);
      if (error.code === 11000) {
        throw new ConflictException(
          'A record with this artist, album, and format already exists.',
        );
      }

      throw new InternalServerErrorException('Failed to create record');
    }
  }

  async updateRecord(
    id: string,
    updateDto: UpdateRecordRequestDTO,
  ): Promise<IApiResponse> {
    try {
      const record = await this.recordModel.findById(id);
      if (!record) {
        throw new NotFoundException('Record not found');
      }

      if (updateDto.mbid && updateDto.mbid !== record.mbid) {
        updateDto.tracklist = await this.musicBrainzService.fetchTracklist(
          updateDto.mbid,
        );
      }

      Object.assign(record, updateDto);
      await record.save();

      return {
        status: true,
        message: 'Record updated successfully',
        data: record,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update record: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update record');
    }
  }

  async findAllRecords(
    q?: string,
    artist?: string,
    album?: string,
    format?: RecordFormat,
    category?: RecordCategory,
    page: number = 1,
    limit: number = 20,
  ): Promise<IApiResponse> {
    const cacheKey = `records:${q || ''}:${artist || ''}:${album || ''}:${format || ''}:${category || ''}:${page}:${limit}`;

    try {
      let cachedRecords: IApiResponse | null = null;
      try {
        cachedRecords = await this.cacheManager.get<IApiResponse>(cacheKey);
      } catch (cacheError) {
        this.logger.warn(`Cache retrieval failed: ${cacheError.message}`);
      }

      if (cachedRecords) {
        return cachedRecords;
      }

      const query: any = {};
      if (q) {
        query.$text = { $search: q };
      } else {
        if (artist) query.artist = { $regex: `^${artist}$`, $options: 'i' };
        if (album) query.album = { $regex: `^${album}$`, $options: 'i' };
      }

      if (format) query.format = format;
      if (category) query.category = category;

      const totalRecords = await this.recordModel.countDocuments(query);
      const records = await this.recordModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec();

      const res = {
        status: true,
        message: 'Records fetched successfully',
        data: {
          records,
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
          },
        },
      };

      await this.cacheManager.set(cacheKey, res, 60 * 1000);

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to fetch records: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch records');
    }
  }

  async updateStock(recordId: string, quantityChange: number): Promise<Record> {
    try {
      const record = await this.recordModel.findById(recordId);
      if (!record) {
        throw new NotFoundException(`Record with ID ${recordId} not found`);
      }

      if (record.qty + quantityChange < 0) {
        throw new BadRequestException('Not enough stock available');
      }
      record.qty += quantityChange;
      await record.save();
      return record;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update stock: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update stock');
    }
  }

  async findOne(recordId: string): Promise<Record | null> {
    try {
      const record = await this.recordModel.findById(recordId);
      if (!record) {
        throw new NotFoundException(`Record with ID ${recordId} not found`);
      }
      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch record: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch record');
    }
  }

  async getRecordById(id: string): Promise<IApiResponse> {
    try {
      const record = await this.findOne(id);

      return {
        status: true,
        message: 'Record found successfully',
        data: record,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch record: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch record');
    }
  }

  async deleteRecord(id: string): Promise<IApiResponse> {
    try {
      const record = await this.recordModel.findByIdAndDelete(id);
      if (!record) {
        throw new NotFoundException(`Record with ID ${id} not found`);
      }

      return {
        status: true,
        message: 'Record deleted successfully',
        data: record,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete record: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete record');
    }
  }
}
