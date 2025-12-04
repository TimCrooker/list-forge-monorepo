import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaListingsController } from './meta-listings.controller';
import { MetaListingsService } from './meta-listings.service';
import { MetaListing } from './entities/meta-listing.entity';
import { Item } from '../items/entities/item.entity';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetaListing, Item]),
    MarketplacesModule,
  ],
  controllers: [MetaListingsController],
  providers: [MetaListingsService],
  exports: [MetaListingsService],
})
export class MetaListingsModule {}

