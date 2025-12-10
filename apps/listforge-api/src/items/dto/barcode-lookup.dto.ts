import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class BarcodeLookupDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8,14}$/, {
    message: 'Barcode must be 8-14 digits',
  })
  barcode: string;
}

export interface BarcodeLookupResult {
  barcode: string;
  found: boolean;
  title?: string;
  description?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  source?: 'upc' | 'ean' | 'amazon' | 'manual';
}
