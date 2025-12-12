import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { ResearchOutcome } from './entities/research-outcome.entity';
import { ToolEffectiveness } from './entities/tool-effectiveness.entity';
import { ResearchAnomaly } from './entities/research-anomaly.entity';
import { Item } from '../items/entities/item.entity';
import { MarketplaceListing } from '../marketplaces/entities/marketplace-listing.entity';

// Services
import { ResearchLearningService } from './services/research-learning.service';
import { ToolCalibrationService } from './services/tool-calibration.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';

// Controllers
import { LearningController, AdminLearningController } from './learning.controller';

// Scheduled Jobs
import { CalibrationProcessor } from './jobs/calibration.processor';

// Other modules
import { ItemsModule } from '../items/items.module';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';

/**
 * LearningModule - Slice 10 (Learning Loop)
 *
 * Provides learning and feedback loop functionality:
 * - Links AI research predictions to actual sales outcomes
 * - Tracks tool effectiveness metrics
 * - Calibrates tool confidence weights based on accuracy
 * - Detects anomalies in research patterns
 *
 * Scheduled jobs run automatically:
 * - Weekly tool recalibration (Sundays at 2 AM)
 * - Daily anomaly detection sweep (2 AM)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResearchOutcome,
      ToolEffectiveness,
      ResearchAnomaly,
      Item,
      MarketplaceListing,
    ]),
    ScheduleModule,
    forwardRef(() => ItemsModule),
    forwardRef(() => MarketplacesModule),
  ],
  controllers: [LearningController, AdminLearningController],
  providers: [
    ResearchLearningService,
    ToolCalibrationService,
    AnomalyDetectionService,
    CalibrationProcessor,
  ],
  exports: [
    ResearchLearningService,
    ToolCalibrationService,
    AnomalyDetectionService,
  ],
})
export class LearningModule {}
