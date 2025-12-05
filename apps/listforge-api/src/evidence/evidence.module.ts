import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceBundle } from './entities/evidence-bundle.entity';
import { EvidenceItem } from './entities/evidence-item.entity';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [TypeOrmModule.forFeature([EvidenceBundle, EvidenceItem])],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
