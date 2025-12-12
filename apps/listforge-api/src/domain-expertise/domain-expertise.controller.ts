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
} from '@nestjs/common';
import type {
  LookupTableDto,
  LookupEntryDto,
  CreateLookupTableDto,
  UpdateLookupTableDto,
  CreateLookupEntryDto,
  UpdateLookupEntryDto,
  BulkLookupEntriesDto,
  ImportLookupEntriesDto,
  ListLookupTablesResponse,
  ListLookupEntriesResponse,
  BulkOperationResponse,
  ListLookupEntriesQuery,
  DomainExpertiseModuleDto,
  DomainExpertiseModuleWithRelationsDto,
  CreateDomainExpertiseModuleDto,
  UpdateDomainExpertiseModuleDto,
  ListDomainExpertiseModulesResponse,
  DomainExpertiseModuleStatus,
  ValueDriverDefinitionDto,
  CreateValueDriverDefinitionDto,
  UpdateValueDriverDefinitionDto,
  ReorderValueDriversDto,
  DecoderDefinitionDto,
  CreateDecoderDefinitionDto,
  UpdateDecoderDefinitionDto,
  TestDecoderDto,
  TestDecoderResponse,
  ValidatePatternDto,
  ValidatePatternResponse,
  AuthenticityMarkerDefinitionDto,
  CreateAuthenticityMarkerDefinitionDto,
  UpdateAuthenticityMarkerDefinitionDto,
  DomainExpertiseVersionDto,
  PublishModuleDto,
  RollbackModuleDto,
  ListVersionsResponse,
  TestValueDriversDto,
  TestValueDriversResponse,
  TestAuthenticityDto,
  TestAuthenticityResponse,
} from '@listforge/api-types';
import type { CategoryId } from '@listforge/core-types';
import { DomainExpertiseService } from './domain-expertise.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import type { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * Domain Expertise Controller - Slice 9.1
 *
 * Admin endpoints for managing domain expertise configuration.
 * All endpoints require staff/superadmin role.
 *
 * Endpoints:
 * - /admin/domain-expertise/modules/* (9.1.2)
 * - /admin/domain-expertise/lookup-tables/* (9.1.1)
 * - /admin/domain-expertise/value-drivers/* (9.1.2)
 * - /admin/domain-expertise/decoders/* (9.1.4)
 * - /admin/domain-expertise/authenticity-markers/* (9.1.3)
 * - /admin/domain-expertise/versions/* (9.1.5)
 */
@Controller('admin/domain-expertise')
@UseGuards(JwtAuthGuard, OrgGuard, AdminGuard)
export class DomainExpertiseController {
  constructor(private readonly service: DomainExpertiseService) {}

  // ===========================================================================
  // LOOKUP TABLE ENDPOINTS
  // ===========================================================================

  /**
   * List all lookup tables
   */
  @Get('lookup-tables')
  async listLookupTables(
    @Query('moduleId') moduleId?: string,
    @Query('search') search?: string,
  ): Promise<ListLookupTablesResponse> {
    const { tables, total } = await this.service.listLookupTables({
      moduleId,
      search,
    });

    return {
      tables: tables.map((t) => this.mapLookupTable(t)),
      total,
    };
  }

  /**
   * Get a lookup table by ID with paginated entries
   */
  @Get('lookup-tables/:id')
  async getLookupTable(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<{ table: LookupTableDto; entries: LookupEntryDto[]; total: number }> {
    const { table, entries, total } = await this.service.getLookupTableWithEntries(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
      search,
    });

    return {
      table: this.mapLookupTable(table),
      entries: entries.map((e) => this.mapLookupEntry(e)),
      total,
    };
  }

  /**
   * Create a new lookup table
   */
  @Post('lookup-tables')
  async createLookupTable(@Body() dto: CreateLookupTableDto): Promise<LookupTableDto> {
    const table = await this.service.createLookupTable(dto);
    return this.mapLookupTable(table);
  }

  /**
   * Update a lookup table
   */
  @Patch('lookup-tables/:id')
  async updateLookupTable(
    @Param('id') id: string,
    @Body() dto: UpdateLookupTableDto,
  ): Promise<LookupTableDto> {
    const table = await this.service.updateLookupTable(id, dto);
    return this.mapLookupTable(table);
  }

  /**
   * Delete a lookup table
   */
  @Delete('lookup-tables/:id')
  async deleteLookupTable(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.service.deleteLookupTable(id);
    return { success: true };
  }

  /**
   * Import entries into a lookup table
   */
  @Post('lookup-tables/:id/import')
  async importLookupEntries(
    @Param('id') id: string,
    @Body() dto: ImportLookupEntriesDto,
  ): Promise<{ created: number; updated: number; errors: Array<{ index: number; error: string }> }> {
    return this.service.importLookupEntries(id, dto);
  }

  /**
   * Export all entries from a lookup table
   */
  @Get('lookup-tables/:id/export')
  async exportLookupEntries(@Param('id') id: string): Promise<{ entries: LookupEntryDto[] }> {
    const entries = await this.service.exportLookupEntries(id);
    return { entries: entries.map((e) => this.mapLookupEntry(e)) };
  }

  // ===========================================================================
  // LOOKUP ENTRY ENDPOINTS
  // ===========================================================================

  /**
   * List entries for a lookup table
   */
  @Get('lookup-tables/:tableId/entries')
  async listLookupEntries(
    @Param('tableId') tableId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<ListLookupEntriesResponse> {
    const result = await this.service.listLookupEntries(tableId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
      search,
    });

    return {
      entries: result.entries.map((e) => this.mapLookupEntry(e)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Create a lookup entry
   */
  @Post('lookup-tables/:tableId/entries')
  async createLookupEntry(
    @Param('tableId') tableId: string,
    @Body() dto: CreateLookupEntryDto,
  ): Promise<LookupEntryDto> {
    const entry = await this.service.createLookupEntry(tableId, dto);
    return this.mapLookupEntry(entry);
  }

  /**
   * Bulk operations on entries
   */
  @Post('lookup-tables/:tableId/entries/bulk')
  async bulkLookupEntries(
    @Param('tableId') tableId: string,
    @Body() dto: BulkLookupEntriesDto,
  ): Promise<BulkOperationResponse> {
    return this.service.bulkLookupEntries(tableId, dto);
  }

  /**
   * Update a lookup entry
   */
  @Patch('lookup-entries/:id')
  async updateLookupEntry(
    @Param('id') id: string,
    @Body() dto: UpdateLookupEntryDto,
  ): Promise<LookupEntryDto> {
    const entry = await this.service.updateLookupEntry(id, dto);
    return this.mapLookupEntry(entry);
  }

  /**
   * Delete a lookup entry
   */
  @Delete('lookup-entries/:id')
  async deleteLookupEntry(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.service.deleteLookupEntry(id);
    return { success: true };
  }

  // ===========================================================================
  // MODULE ENDPOINTS (Sub-Slice 9.1.2)
  // ===========================================================================

  /**
   * List all domain expertise modules
   */
  @Get('modules')
  async listModules(
    @Query('categoryId') categoryId?: CategoryId,
    @Query('status') status?: DomainExpertiseModuleStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ListDomainExpertiseModulesResponse> {
    const { modules, total } = await this.service.listModules({
      categoryId,
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return {
      modules: modules.map((m) => this.mapModule(m)),
      total,
    };
  }

  /**
   * Get a module by ID
   */
  @Get('modules/:id')
  async getModule(
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<DomainExpertiseModuleWithRelationsDto> {
    const includeArr = include?.split(',') || [];
    const module = await this.service.getModuleWithRelations(id, includeArr);
    return this.mapModuleWithRelations(module, includeArr);
  }

  /**
   * Create a new module
   */
  @Post('modules')
  async createModule(
    @ReqCtx() ctx: RequestContext,
    @Body() dto: CreateDomainExpertiseModuleDto,
  ): Promise<DomainExpertiseModuleDto> {
    const module = await this.service.createModule(dto, ctx.userId);
    return this.mapModule(module);
  }

  /**
   * Update a module
   */
  @Patch('modules/:id')
  async updateModule(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: UpdateDomainExpertiseModuleDto,
  ): Promise<DomainExpertiseModuleDto> {
    const module = await this.service.updateModule(id, dto, ctx.userId);
    return this.mapModule(module);
  }

  /**
   * Archive a module
   */
  @Delete('modules/:id')
  async deleteModule(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.service.deleteModule(id, ctx.userId);
    return { success: true };
  }

  /**
   * Duplicate a module
   */
  @Post('modules/:id/duplicate')
  async duplicateModule(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: { name: string },
  ): Promise<DomainExpertiseModuleDto> {
    const module = await this.service.duplicateModule(id, body.name, ctx.userId);
    return this.mapModule(module);
  }

  /**
   * Publish a module (create new version)
   */
  @Post('modules/:id/publish')
  async publishModule(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: PublishModuleDto,
  ): Promise<DomainExpertiseVersionDto> {
    const version = await this.service.publishModule(id, dto.changelog, ctx.userId);
    return this.mapVersion(version);
  }

  /**
   * Rollback a module to a previous version
   */
  @Post('modules/:id/rollback')
  async rollbackModule(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: RollbackModuleDto,
  ): Promise<DomainExpertiseVersionDto> {
    const version = await this.service.rollbackModule(id, dto.versionId, ctx.userId, dto.reason);
    return this.mapVersion(version);
  }

  /**
   * List versions for a module
   */
  @Get('modules/:id/versions')
  async listVersions(@Param('id') id: string): Promise<ListVersionsResponse> {
    const versions = await this.service.listVersions(id);
    return {
      versions: versions.map((v) => this.mapVersion(v)),
      total: versions.length,
    };
  }

  // ===========================================================================
  // VALUE DRIVER ENDPOINTS (Sub-Slice 9.1.2)
  // ===========================================================================

  /**
   * List value drivers for a module
   */
  @Get('modules/:moduleId/value-drivers')
  async listValueDrivers(
    @Param('moduleId') moduleId: string,
  ): Promise<{ drivers: ValueDriverDefinitionDto[] }> {
    const drivers = await this.service.listValueDrivers(moduleId);
    return { drivers: drivers.map((d) => this.mapValueDriver(d)) };
  }

  /**
   * Create a value driver
   */
  @Post('modules/:moduleId/value-drivers')
  async createValueDriver(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateValueDriverDefinitionDto,
  ): Promise<ValueDriverDefinitionDto> {
    const driver = await this.service.createValueDriver(moduleId, dto);
    return this.mapValueDriver(driver);
  }

  /**
   * Update a value driver
   */
  @Patch('value-drivers/:id')
  async updateValueDriver(
    @Param('id') id: string,
    @Body() dto: UpdateValueDriverDefinitionDto,
  ): Promise<ValueDriverDefinitionDto> {
    const driver = await this.service.updateValueDriver(id, dto);
    return this.mapValueDriver(driver);
  }

  /**
   * Delete a value driver
   */
  @Delete('value-drivers/:id')
  async deleteValueDriver(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.service.deleteValueDriver(id);
    return { success: true };
  }

  /**
   * Reorder value drivers
   */
  @Post('modules/:moduleId/value-drivers/reorder')
  async reorderValueDrivers(
    @Param('moduleId') moduleId: string,
    @Body() dto: ReorderValueDriversDto,
  ): Promise<{ success: boolean }> {
    await this.service.reorderValueDrivers(moduleId, dto.orderedIds);
    return { success: true };
  }

  // ===========================================================================
  // DECODER ENDPOINTS (Sub-Slice 9.1.4)
  // ===========================================================================

  /**
   * List decoders for a module
   */
  @Get('modules/:moduleId/decoders')
  async listDecoders(
    @Param('moduleId') moduleId: string,
  ): Promise<{ decoders: DecoderDefinitionDto[] }> {
    const decoders = await this.service.listDecoders(moduleId);
    return { decoders: decoders.map((d) => this.mapDecoder(d)) };
  }

  /**
   * Create a decoder
   */
  @Post('modules/:moduleId/decoders')
  async createDecoder(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateDecoderDefinitionDto,
  ): Promise<DecoderDefinitionDto> {
    const decoder = await this.service.createDecoder(moduleId, dto);
    return this.mapDecoder(decoder);
  }

  /**
   * Update a decoder
   */
  @Patch('decoders/:id')
  async updateDecoder(
    @Param('id') id: string,
    @Body() dto: UpdateDecoderDefinitionDto,
  ): Promise<DecoderDefinitionDto> {
    const decoder = await this.service.updateDecoder(id, dto);
    return this.mapDecoder(decoder);
  }

  /**
   * Delete a decoder
   */
  @Delete('decoders/:id')
  async deleteDecoder(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.service.deleteDecoder(id);
    return { success: true };
  }

  /**
   * Test a decoder with input
   */
  @Post('decoders/:id/test')
  async testDecoder(
    @Param('id') id: string,
    @Body() dto: TestDecoderDto,
  ): Promise<TestDecoderResponse> {
    return this.service.testDecoder(id, dto.input);
  }

  /**
   * Validate a regex pattern
   */
  @Post('decoders/validate-pattern')
  async validatePattern(@Body() dto: ValidatePatternDto): Promise<ValidatePatternResponse> {
    return this.service.validateRegexPattern(dto.pattern);
  }

  // ===========================================================================
  // AUTHENTICITY MARKER ENDPOINTS (Sub-Slice 9.1.3)
  // ===========================================================================

  /**
   * List authenticity markers for a module
   */
  @Get('modules/:moduleId/authenticity-markers')
  async listAuthenticityMarkers(
    @Param('moduleId') moduleId: string,
  ): Promise<{ markers: AuthenticityMarkerDefinitionDto[] }> {
    const markers = await this.service.listAuthenticityMarkers(moduleId);
    return { markers: markers.map((m) => this.mapAuthenticityMarker(m)) };
  }

  /**
   * Create an authenticity marker
   */
  @Post('modules/:moduleId/authenticity-markers')
  async createAuthenticityMarker(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateAuthenticityMarkerDefinitionDto,
  ): Promise<AuthenticityMarkerDefinitionDto> {
    const marker = await this.service.createAuthenticityMarker(moduleId, dto);
    return this.mapAuthenticityMarker(marker);
  }

  /**
   * Update an authenticity marker
   */
  @Patch('authenticity-markers/:id')
  async updateAuthenticityMarker(
    @Param('id') id: string,
    @Body() dto: UpdateAuthenticityMarkerDefinitionDto,
  ): Promise<AuthenticityMarkerDefinitionDto> {
    const marker = await this.service.updateAuthenticityMarker(id, dto);
    return this.mapAuthenticityMarker(marker);
  }

  /**
   * Delete an authenticity marker
   */
  @Delete('authenticity-markers/:id')
  async deleteAuthenticityMarker(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.service.deleteAuthenticityMarker(id);
    return { success: true };
  }

  // ===========================================================================
  // TESTING ENDPOINTS
  // ===========================================================================

  /**
   * Test decode pipeline for a module
   */
  @Post('modules/:moduleId/test-decode')
  async testDecodePipeline(
    @Param('moduleId') moduleId: string,
    @Body() body: { identifierType?: string; value: string },
  ): Promise<TestDecoderResponse & { decoderName?: string }> {
    return this.service.testDecodePipeline(moduleId, body.identifierType || '', body.value);
  }

  /**
   * Test value drivers for a module
   */
  @Post('modules/:moduleId/test-value-drivers')
  async testValueDrivers(
    @Param('moduleId') moduleId: string,
    @Body() dto: TestValueDriversDto,
  ): Promise<TestValueDriversResponse> {
    return this.service.testValueDrivers(moduleId, dto.fields);
  }

  /**
   * Test authenticity markers for a module
   */
  @Post('modules/:moduleId/test-authenticity')
  async testAuthenticity(
    @Param('moduleId') moduleId: string,
    @Body() dto: TestAuthenticityDto,
  ): Promise<TestAuthenticityResponse> {
    return this.service.testAuthenticity(moduleId, dto.identifiers, dto.extractedText);
  }

  // ===========================================================================
  // MAPPERS
  // ===========================================================================

  private mapLookupTable(table: any): LookupTableDto {
    return {
      id: table.id,
      moduleId: table.moduleId,
      name: table.name,
      description: table.description,
      keyField: table.keyField,
      valueSchema: table.valueSchema,
      entryCount: table.entryCount || 0,
      isActive: table.isActive,
      createdAt: table.createdAt.toISOString(),
      updatedAt: table.updatedAt.toISOString(),
    };
  }

  private mapLookupEntry(entry: any): LookupEntryDto {
    return {
      id: entry.id,
      tableId: entry.tableId,
      key: entry.key,
      values: entry.values,
      isActive: entry.isActive,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private mapModule(module: any): DomainExpertiseModuleDto {
    return {
      id: module.id,
      name: module.name,
      description: module.description,
      categoryId: module.categoryId,
      applicableBrands: module.applicableBrands,
      currentVersion: module.currentVersion,
      status: module.status,
      createdBy: module.createdBy,
      createdAt: module.createdAt.toISOString(),
      lastModifiedBy: module.lastModifiedBy,
      lastModifiedAt: module.updatedAt.toISOString(),
      publishedAt: module.publishedAt?.toISOString() || null,
    };
  }

  private mapModuleWithRelations(
    module: any,
    include: string[],
  ): DomainExpertiseModuleWithRelationsDto {
    const result: DomainExpertiseModuleWithRelationsDto = this.mapModule(module);

    if (include.includes('decoders') && module.decoders) {
      result.decoders = module.decoders.map((d: any) => this.mapDecoder(d));
    }
    if (include.includes('lookupTables') && module.lookupTables) {
      result.lookupTables = module.lookupTables.map((t: any) => this.mapLookupTable(t));
    }
    if (include.includes('valueDrivers') && module.valueDrivers) {
      result.valueDrivers = module.valueDrivers.map((v: any) => this.mapValueDriver(v));
    }
    if (include.includes('authenticityMarkers') && module.authenticityMarkers) {
      result.authenticityMarkers = module.authenticityMarkers.map((m: any) =>
        this.mapAuthenticityMarker(m),
      );
    }

    return result;
  }

  private mapValueDriver(driver: any): ValueDriverDefinitionDto {
    return {
      id: driver.id,
      moduleId: driver.moduleId,
      name: driver.name,
      description: driver.description,
      attribute: driver.attribute,
      conditionType: driver.conditionType,
      conditionValue: driver.conditionValue,
      caseSensitive: driver.caseSensitive,
      priceMultiplier: Number(driver.priceMultiplier),
      priority: driver.priority,
      applicableBrands: driver.applicableBrands,
      isActive: driver.isActive,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    };
  }

  private mapDecoder(decoder: any): DecoderDefinitionDto {
    return {
      id: decoder.id,
      moduleId: decoder.moduleId,
      name: decoder.name,
      identifierType: decoder.identifierType,
      description: decoder.description,
      inputPattern: decoder.inputPattern,
      inputMaxLength: decoder.inputMaxLength,
      extractionRules: decoder.extractionRules,
      lookupTableId: decoder.lookupTableId,
      lookupKeyGroup: decoder.lookupKeyGroup,
      validationRules: decoder.validationRules,
      outputFields: decoder.outputFields,
      baseConfidence: Number(decoder.baseConfidence),
      priority: decoder.priority,
      isActive: decoder.isActive,
      testCases: decoder.testCases,
      createdAt: decoder.createdAt.toISOString(),
      updatedAt: decoder.updatedAt.toISOString(),
    };
  }

  private mapAuthenticityMarker(marker: any): AuthenticityMarkerDefinitionDto {
    return {
      id: marker.id,
      moduleId: marker.moduleId,
      name: marker.name,
      checkDescription: marker.checkDescription,
      pattern: marker.pattern,
      patternMaxLength: marker.patternMaxLength,
      importance: marker.importance,
      indicatesAuthentic: marker.indicatesAuthentic,
      applicableBrands: marker.applicableBrands,
      isActive: marker.isActive,
      createdAt: marker.createdAt.toISOString(),
      updatedAt: marker.updatedAt.toISOString(),
    };
  }

  private mapVersion(version: any): DomainExpertiseVersionDto {
    return {
      id: version.id,
      moduleId: version.moduleId,
      version: version.version,
      changelog: version.changelog,
      publishedBy: version.publishedBy,
      publishedAt: version.publishedAt.toISOString(),
      isActive: version.isActive,
    };
  }
}
