import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaListingsController } from './meta-listings.controller';
import { MetaListingsService } from './meta-listings.service';
import { MetaListing } from './entities/meta-listing.entity';
import { Item } from '../items/entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetaListing, Item])],
  controllers: [MetaListingsController],
  providers: [MetaListingsService],
  exports: [MetaListingsService],
})
export class MetaListingsModule {}

