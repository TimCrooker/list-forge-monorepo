import { IsString, IsOptional, IsArray } from 'class-validator';

export class QuickEvalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export interface QuickEvalResult {
  success: boolean;

  // Product identification
  identifiedAs?: {
    title: string;
    brand?: string;
    category?: string;
    confidence: number;
  };

  // Pricing analysis
  pricing?: {
    suggestedPrice: number;
    priceRangeLow: number;
    priceRangeHigh: number;
    currency: string;
    confidence: number;
  };

  // Market demand
  demand?: {
    level: 'low' | 'medium' | 'high';
    indicators: string[];
  };

  // Comparables summary
  comparables?: {
    count: number;
    averagePrice: number;
    recentSales: number;
  };

  // Processing info
  processingTimeMs: number;
  warnings?: string[];
}
