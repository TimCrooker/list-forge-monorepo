import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LookupTable,
  LookupEntry,
  DomainExpertiseModuleEntity,
  ValueDriverDefinition,
  DecoderDefinition,
  AuthenticityMarkerDefinition,
  DomainExpertiseVersion,
} from './entities';
import { DomainExpertiseController } from './domain-expertise.controller';
import { DomainExpertiseService } from './domain-expertise.service';

/**
 * Domain Expertise Module - Slice 9.1
 *
 * Provides admin-configurable domain knowledge for the research system:
 * - Lookup tables (factory codes, year codes, references)
 * - Value drivers (price multipliers based on attributes)
 * - Authenticity markers (pattern validation)
 * - Decoder definitions (pattern-based identifier parsing)
 * - Version control (publish/rollback)
 *
 * All endpoints are staff-only (/admin/domain-expertise/*)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LookupTable,
      LookupEntry,
      DomainExpertiseModuleEntity,
      ValueDriverDefinition,
      DecoderDefinition,
      AuthenticityMarkerDefinition,
      DomainExpertiseVersion,
    ]),
  ],
  controllers: [DomainExpertiseController],
  providers: [DomainExpertiseService],
  exports: [DomainExpertiseService],
})
export class DomainExpertiseModule {}
