/**
 * Type definition for Multer uploaded files
 * Used by file upload endpoints
 */
export type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};
