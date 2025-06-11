import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// Define allowed MIME types and their categories
const MIME_TYPES_CATEGORIES = {
  images: ['image/jpeg', 'image/jpg', 'image/png'],
  documents: [
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  ],
  videos: ['video/mp4'],
};

// Combine all allowed MIME types
// const allowedMimeTypes = Object.values(MIME_TYPES_CATEGORIES).flat();
const allowedMimeTypes = [
  ...MIME_TYPES_CATEGORIES.images,
  ...MIME_TYPES_CATEGORIES.documents,
  ...MIME_TYPES_CATEGORIES.videos,
];

// Define file size limits for different file categories (in bytes)
const FILE_SIZE_LIMITS = {
  images: 10 * 1024 * 1024, // 10MB
  documents: 25 * 1024 * 1024, // 25MB
  videos: 200 * 1024 * 1024, // 200MB
  default: 10 * 1024 * 1024, // 10MB
};

// Helper function to get file category
const getFileCategory = (mimetype: string): keyof typeof FILE_SIZE_LIMITS => {
  if (MIME_TYPES_CATEGORIES.images.includes(mimetype)) return 'images';
  if (MIME_TYPES_CATEGORIES.documents.includes(mimetype)) return 'documents';
  if (MIME_TYPES_CATEGORIES.videos.includes(mimetype)) return 'videos';
  return 'default';
};

export const multerOptions: MulterOptions = {
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Invalid file type. Only ${allowedMimeTypes.join(', ')} files are allowed`,
        ),
        false,
      );
    }

    const receivedFileSize = parseInt(req.headers['content-length'], 10);
    const fileCategory = getFileCategory(file.mimetype);
    const fileSizeLimit = FILE_SIZE_LIMITS[fileCategory];

    if (receivedFileSize > fileSizeLimit) {
      return callback(
        new BadRequestException(
          `The received file size of ${(receivedFileSize / (1024 * 1024)).toFixed(2)}MB exceeds the limit for ${fileCategory} category file size of ${fileSizeLimit / (1024 * 1024)}MB`,
        ),
        false,
      );
    }

    callback(null, true);
  },
};
