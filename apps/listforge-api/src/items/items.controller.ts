import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  CreateItemResponse,
  GetItemResponse,
  ListItemsResponse,
  UpdateItemRequest,
  UpdateItemResponse,
} from '@listforge/api-types';

// Type for uploaded files
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Controller('items')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 10))
  async create(
    @ReqCtx() ctx: RequestContext,
    @UploadedFiles() photos: MulterFile[],
  ): Promise<CreateItemResponse> {
    return this.itemsService.create(ctx, photos);
  }

  @Get()
  async list(
    @ReqCtx() ctx: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListItemsResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.itemsService.findAll(ctx, pageNum, pageSizeNum);
  }

  @Get(':id')
  async getOne(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetItemResponse> {
    return this.itemsService.findOne(id, ctx);
  }

  @Patch(':id')
  async update(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: UpdateItemRequest,
  ): Promise<UpdateItemResponse> {
    return this.itemsService.update(id, ctx, body);
  }

  @Delete(':id')
  async remove(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.itemsService.remove(id, ctx);
  }
}

