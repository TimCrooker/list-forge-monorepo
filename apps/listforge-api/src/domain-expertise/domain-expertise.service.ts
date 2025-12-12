import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import type { CategoryId } from '@listforge/core-types';
import {
  LookupTable,
  LookupEntry,
  LookupValueField,
  DomainExpertiseModuleEntity,
  ValueDriverDefinition,
  DecoderDefinition,
  AuthenticityMarkerDefinition,
  DomainExpertiseVersion,
  DomainExpertiseSnapshot,
  ExtractionRule,
  ValidationRule,
  OutputFieldMapping,
} from './entities';
import type {
  CreateLookupTableDto,
  UpdateLookupTableDto,
  CreateLookupEntryDto,
  UpdateLookupEntryDto,
  BulkLookupEntriesDto,
  ImportLookupEntriesDto,
  ListLookupEntriesQuery,
  CreateDomainExpertiseModuleDto,
  UpdateDomainExpertiseModuleDto,
  ListModulesQuery,
  CreateValueDriverDefinitionDto,
  UpdateValueDriverDefinitionDto,
  DomainExpertiseModuleStatus,
  CreateDecoderDefinitionDto,
  UpdateDecoderDefinitionDto,
  CreateAuthenticityMarkerDefinitionDto,
  UpdateAuthenticityMarkerDefinitionDto,
  TestDecoderResponse,
  TestAuthenticityResponse,
  ValidatePatternResponse,
} from '@listforge/api-types';

/**
 * Domain Expertise Service - Slice 9.1
 *
 * Manages the domain expertise system:
 * - Modules (top-level containers)
 * - Lookup tables (reference data)
 * - Value drivers (price multipliers)
 * - Authenticity markers (pattern validation)
 * - Decoders (identifier parsing)
 * - Version control (publish/rollback)
 */
@Injectable()
export class DomainExpertiseService {
  constructor(
    @InjectRepository(LookupTable)
    private readonly lookupTableRepo: Repository<LookupTable>,
    @InjectRepository(LookupEntry)
    private readonly lookupEntryRepo: Repository<LookupEntry>,
    @InjectRepository(DomainExpertiseModuleEntity)
    private readonly moduleRepo: Repository<DomainExpertiseModuleEntity>,
    @InjectRepository(ValueDriverDefinition)
    private readonly valueDriverRepo: Repository<ValueDriverDefinition>,
    @InjectRepository(DecoderDefinition)
    private readonly decoderRepo: Repository<DecoderDefinition>,
    @InjectRepository(AuthenticityMarkerDefinition)
    private readonly markerRepo: Repository<AuthenticityMarkerDefinition>,
    @InjectRepository(DomainExpertiseVersion)
    private readonly versionRepo: Repository<DomainExpertiseVersion>,
  ) {}

  // ===========================================================================
  // LOOKUP TABLE CRUD
  // ===========================================================================

  /**
   * List all lookup tables with optional filtering
   */
  async listLookupTables(options?: {
    moduleId?: string;
    search?: string;
  }): Promise<{ tables: LookupTable[]; total: number }> {
    const query = this.lookupTableRepo.createQueryBuilder('table');

    if (options?.moduleId) {
      query.andWhere('table.moduleId = :moduleId', { moduleId: options.moduleId });
    }

    if (options?.search) {
      query.andWhere('(table.name ILIKE :search OR table.description ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    query.orderBy('table.name', 'ASC');

    const [tables, total] = await query.getManyAndCount();

    // Add entry counts
    for (const table of tables) {
      const entryCount = await this.lookupEntryRepo.count({
        where: { tableId: table.id },
      });
      (table as LookupTable & { entryCount: number }).entryCount = entryCount;
    }

    return { tables, total };
  }

  /**
   * Get a single lookup table by ID
   */
  async getLookupTable(id: string): Promise<LookupTable> {
    const table = await this.lookupTableRepo.findOne({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`Lookup table with ID ${id} not found`);
    }

    return table;
  }

  /**
   * Get a lookup table with its entries
   */
  async getLookupTableWithEntries(
    id: string,
    query?: ListLookupEntriesQuery,
  ): Promise<{ table: LookupTable; entries: LookupEntry[]; total: number }> {
    const table = await this.getLookupTable(id);

    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const offset = (page - 1) * limit;

    const entryQuery = this.lookupEntryRepo.createQueryBuilder('entry')
      .where('entry.tableId = :tableId', { tableId: id });

    if (query?.search) {
      entryQuery.andWhere('entry.key ILIKE :search', { search: `%${query.search}%` });
    }

    entryQuery
      .orderBy('entry.key', 'ASC')
      .skip(offset)
      .take(limit);

    const [entries, total] = await entryQuery.getManyAndCount();

    return { table, entries, total };
  }

  /**
   * Create a new lookup table
   */
  async createLookupTable(dto: CreateLookupTableDto): Promise<LookupTable> {
    // Validate value schema
    this.validateValueSchema(dto.valueSchema);

    const table = this.lookupTableRepo.create({
      moduleId: dto.moduleId || null,
      name: dto.name,
      description: dto.description || '',
      keyField: dto.keyField,
      valueSchema: dto.valueSchema,
      isActive: true,
    });

    return this.lookupTableRepo.save(table);
  }

  /**
   * Update a lookup table
   */
  async updateLookupTable(id: string, dto: UpdateLookupTableDto): Promise<LookupTable> {
    const table = await this.getLookupTable(id);

    if (dto.valueSchema) {
      this.validateValueSchema(dto.valueSchema);
    }

    Object.assign(table, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.keyField !== undefined && { keyField: dto.keyField }),
      ...(dto.valueSchema !== undefined && { valueSchema: dto.valueSchema }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.lookupTableRepo.save(table);
  }

  /**
   * Delete a lookup table and all its entries
   */
  async deleteLookupTable(id: string): Promise<void> {
    const table = await this.getLookupTable(id);
    await this.lookupTableRepo.remove(table);
  }

  /**
   * Validate value schema
   */
  private validateValueSchema(schema: LookupValueField[]): void {
    if (!Array.isArray(schema)) {
      throw new BadRequestException('Value schema must be an array');
    }

    const fieldNames = new Set<string>();
    for (const field of schema) {
      if (!field.name || typeof field.name !== 'string') {
        throw new BadRequestException('Each schema field must have a name');
      }
      if (!['string', 'number', 'boolean'].includes(field.type)) {
        throw new BadRequestException(`Invalid field type: ${field.type}`);
      }
      if (fieldNames.has(field.name)) {
        throw new BadRequestException(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);
    }
  }

  // ===========================================================================
  // LOOKUP ENTRY CRUD
  // ===========================================================================

  /**
   * List entries for a lookup table
   */
  async listLookupEntries(
    tableId: string,
    query?: ListLookupEntriesQuery,
  ): Promise<{ entries: LookupEntry[]; total: number; page: number; limit: number }> {
    // Verify table exists
    await this.getLookupTable(tableId);

    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const offset = (page - 1) * limit;

    const entryQuery = this.lookupEntryRepo.createQueryBuilder('entry')
      .where('entry.tableId = :tableId', { tableId });

    if (query?.search) {
      entryQuery.andWhere('entry.key ILIKE :search', { search: `%${query.search}%` });
    }

    entryQuery
      .orderBy('entry.key', 'ASC')
      .skip(offset)
      .take(limit);

    const [entries, total] = await entryQuery.getManyAndCount();

    return { entries, total, page, limit };
  }

  /**
   * Get a single lookup entry by ID
   */
  async getLookupEntry(id: string): Promise<LookupEntry> {
    const entry = await this.lookupEntryRepo.findOne({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Lookup entry with ID ${id} not found`);
    }

    return entry;
  }

  /**
   * Get a lookup entry by table ID and key
   */
  async getLookupEntryByKey(tableId: string, key: string): Promise<LookupEntry | null> {
    return this.lookupEntryRepo.findOne({
      where: { tableId, key },
    });
  }

  /**
   * Create a lookup entry
   */
  async createLookupEntry(tableId: string, dto: CreateLookupEntryDto): Promise<LookupEntry> {
    const table = await this.getLookupTable(tableId);

    // Check for duplicate key
    const existing = await this.getLookupEntryByKey(tableId, dto.key);
    if (existing) {
      throw new BadRequestException(`Entry with key "${dto.key}" already exists in this table`);
    }

    // Validate values against schema
    this.validateEntryValues(dto.values, table.valueSchema);

    const entry = this.lookupEntryRepo.create({
      tableId,
      key: dto.key,
      values: dto.values,
      isActive: true,
    });

    return this.lookupEntryRepo.save(entry);
  }

  /**
   * Update a lookup entry
   */
  async updateLookupEntry(id: string, dto: UpdateLookupEntryDto): Promise<LookupEntry> {
    const entry = await this.lookupEntryRepo.findOne({
      where: { id },
      relations: ['table'],
    });

    if (!entry) {
      throw new NotFoundException(`Lookup entry with ID ${id} not found`);
    }

    // If changing key, check for duplicates
    if (dto.key && dto.key !== entry.key) {
      const existing = await this.getLookupEntryByKey(entry.tableId, dto.key);
      if (existing) {
        throw new BadRequestException(`Entry with key "${dto.key}" already exists in this table`);
      }
    }

    // Validate values if provided
    if (dto.values) {
      const table = await this.getLookupTable(entry.tableId);
      this.validateEntryValues(dto.values, table.valueSchema);
    }

    Object.assign(entry, {
      ...(dto.key !== undefined && { key: dto.key }),
      ...(dto.values !== undefined && { values: dto.values }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.lookupEntryRepo.save(entry);
  }

  /**
   * Delete a lookup entry
   */
  async deleteLookupEntry(id: string): Promise<void> {
    const entry = await this.getLookupEntry(id);
    await this.lookupEntryRepo.remove(entry);
  }

  /**
   * Bulk operations on entries
   */
  async bulkLookupEntries(
    tableId: string,
    dto: BulkLookupEntriesDto,
  ): Promise<{ created: number; updated: number; deleted: number; errors: Array<{ index: number; error: string }> }> {
    const table = await this.getLookupTable(tableId);
    const result = { created: 0, updated: 0, deleted: 0, errors: [] as Array<{ index: number; error: string }> };

    for (let i = 0; i < dto.entries.length; i++) {
      const entryData = dto.entries[i];
      try {
        switch (dto.operation) {
          case 'create':
            if (!entryData.key || !entryData.values) {
              throw new Error('Key and values are required for create');
            }
            await this.createLookupEntry(tableId, {
              key: entryData.key,
              values: entryData.values,
            });
            result.created++;
            break;

          case 'update':
            if (!entryData.id) {
              throw new Error('ID is required for update');
            }
            await this.updateLookupEntry(entryData.id, {
              key: entryData.key,
              values: entryData.values,
            });
            result.updated++;
            break;

          case 'delete':
            if (!entryData.id) {
              throw new Error('ID is required for delete');
            }
            await this.deleteLookupEntry(entryData.id);
            result.deleted++;
            break;
        }
      } catch (error) {
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Import entries from a list
   */
  async importLookupEntries(
    tableId: string,
    dto: ImportLookupEntriesDto,
  ): Promise<{ created: number; updated: number; errors: Array<{ index: number; error: string }> }> {
    const table = await this.getLookupTable(tableId);
    const result = { created: 0, updated: 0, errors: [] as Array<{ index: number; error: string }> };

    for (let i = 0; i < dto.entries.length; i++) {
      const entryData = dto.entries[i];
      try {
        // Validate values
        this.validateEntryValues(entryData.values, table.valueSchema);

        const existing = await this.getLookupEntryByKey(tableId, entryData.key);
        if (existing) {
          if (dto.overwriteExisting) {
            await this.updateLookupEntry(existing.id, { values: entryData.values });
            result.updated++;
          } else {
            result.errors.push({
              index: i,
              error: `Entry with key "${entryData.key}" already exists`,
            });
          }
        } else {
          await this.createLookupEntry(tableId, entryData);
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Export all entries from a table
   */
  async exportLookupEntries(tableId: string): Promise<LookupEntry[]> {
    await this.getLookupTable(tableId);

    return this.lookupEntryRepo.find({
      where: { tableId },
      order: { key: 'ASC' },
    });
  }

  /**
   * Validate entry values against table schema
   */
  private validateEntryValues(values: Record<string, unknown>, schema: LookupValueField[]): void {
    for (const field of schema) {
      const value = values[field.name];

      if (field.required && (value === undefined || value === null)) {
        throw new BadRequestException(`Required field "${field.name}" is missing`);
      }

      if (value !== undefined && value !== null) {
        const actualType = typeof value;
        if (actualType !== field.type) {
          throw new BadRequestException(
            `Field "${field.name}" should be ${field.type} but got ${actualType}`,
          );
        }
      }
    }
  }

  // ===========================================================================
  // LOOKUP HELPERS (for use by DomainKnowledgeService)
  // ===========================================================================

  /**
   * Perform a lookup by table ID and key
   * Returns the values or null if not found
   */
  async lookup(tableId: string, key: string): Promise<Record<string, unknown> | null> {
    const entry = await this.lookupEntryRepo.findOne({
      where: { tableId, key, isActive: true },
    });

    return entry?.values || null;
  }

  /**
   * Perform a lookup by table name and key
   * Useful when you know the table name but not the ID
   */
  async lookupByTableName(tableName: string, key: string): Promise<Record<string, unknown> | null> {
    const entry = await this.lookupEntryRepo
      .createQueryBuilder('entry')
      .innerJoin('entry.table', 'table')
      .where('table.name = :tableName', { tableName })
      .andWhere('table.isActive = true')
      .andWhere('entry.key = :key', { key })
      .andWhere('entry.isActive = true')
      .getOne();

    return entry?.values || null;
  }

  // ===========================================================================
  // MODULE CRUD (Sub-Slice 9.1.2)
  // ===========================================================================

  /**
   * List all domain expertise modules with filtering
   */
  async listModules(
    query?: ListModulesQuery,
  ): Promise<{ modules: DomainExpertiseModuleEntity[]; total: number }> {
    const qb = this.moduleRepo.createQueryBuilder('module');

    if (query?.categoryId) {
      qb.andWhere('module.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query?.status) {
      qb.andWhere('module.status = :status', { status: query.status });
    }

    if (query?.search) {
      qb.andWhere(
        '(module.name ILIKE :search OR module.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('module.updatedAt', 'DESC');

    if (query?.page && query?.limit) {
      qb.skip((query.page - 1) * query.limit).take(query.limit);
    }

    const [modules, total] = await qb.getManyAndCount();
    return { modules, total };
  }

  /**
   * Get a module by ID
   */
  async getModule(id: string): Promise<DomainExpertiseModuleEntity> {
    const module = await this.moduleRepo.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
    return module;
  }

  /**
   * Get a module with all its relations
   */
  async getModuleWithRelations(
    id: string,
    include?: string[],
  ): Promise<DomainExpertiseModuleEntity> {
    const relations: string[] = [];
    if (include?.includes('lookupTables')) relations.push('lookupTables');
    if (include?.includes('valueDrivers')) relations.push('valueDrivers');

    const module = await this.moduleRepo.findOne({
      where: { id },
      relations,
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    return module;
  }

  /**
   * Create a new module
   */
  async createModule(
    dto: CreateDomainExpertiseModuleDto,
    userId: string,
  ): Promise<DomainExpertiseModuleEntity> {
    const module = this.moduleRepo.create({
      name: dto.name,
      description: dto.description || '',
      categoryId: dto.categoryId,
      applicableBrands: dto.applicableBrands || [],
      status: 'draft',
      currentVersion: 0,
      createdBy: userId,
      lastModifiedBy: userId,
      publishedAt: null,
    });

    return this.moduleRepo.save(module);
  }

  /**
   * Update a module
   */
  async updateModule(
    id: string,
    dto: UpdateDomainExpertiseModuleDto,
    userId: string,
  ): Promise<DomainExpertiseModuleEntity> {
    const module = await this.getModule(id);

    Object.assign(module, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.applicableBrands !== undefined && { applicableBrands: dto.applicableBrands }),
      lastModifiedBy: userId,
    });

    return this.moduleRepo.save(module);
  }

  /**
   * Delete (archive) a module
   */
  async deleteModule(id: string, userId: string): Promise<void> {
    const module = await this.getModule(id);
    module.status = 'archived';
    module.lastModifiedBy = userId;
    await this.moduleRepo.save(module);
  }

  /**
   * Duplicate a module
   */
  async duplicateModule(
    id: string,
    newName: string,
    userId: string,
  ): Promise<DomainExpertiseModuleEntity> {
    const source = await this.getModuleWithRelations(id, ['lookupTables', 'valueDrivers']);

    // Create new module
    const newModule = this.moduleRepo.create({
      name: newName,
      description: source.description,
      categoryId: source.categoryId,
      applicableBrands: [...source.applicableBrands],
      status: 'draft',
      currentVersion: 0,
      createdBy: userId,
      lastModifiedBy: userId,
      publishedAt: null,
    });

    const savedModule = await this.moduleRepo.save(newModule);

    // Duplicate lookup tables
    if (source.lookupTables?.length) {
      for (const table of source.lookupTables) {
        const newTable = this.lookupTableRepo.create({
          moduleId: savedModule.id,
          name: table.name,
          description: table.description,
          keyField: table.keyField,
          valueSchema: [...table.valueSchema],
          isActive: table.isActive,
        });
        const savedTable = await this.lookupTableRepo.save(newTable);

        // Duplicate entries
        const entries = await this.lookupEntryRepo.find({ where: { tableId: table.id } });
        for (const entry of entries) {
          await this.lookupEntryRepo.save(
            this.lookupEntryRepo.create({
              tableId: savedTable.id,
              key: entry.key,
              values: { ...entry.values },
              isActive: entry.isActive,
            }),
          );
        }
      }
    }

    // Duplicate value drivers
    if (source.valueDrivers?.length) {
      for (const driver of source.valueDrivers) {
        await this.valueDriverRepo.save(
          this.valueDriverRepo.create({
            moduleId: savedModule.id,
            name: driver.name,
            description: driver.description,
            attribute: driver.attribute,
            conditionType: driver.conditionType,
            conditionValue: driver.conditionValue,
            caseSensitive: driver.caseSensitive,
            priceMultiplier: driver.priceMultiplier,
            priority: driver.priority,
            applicableBrands: [...driver.applicableBrands],
            isActive: driver.isActive,
          }),
        );
      }
    }

    return savedModule;
  }

  // ===========================================================================
  // VALUE DRIVER CRUD (Sub-Slice 9.1.2)
  // ===========================================================================

  /**
   * List value drivers for a module
   */
  async listValueDrivers(moduleId: string): Promise<ValueDriverDefinition[]> {
    await this.getModule(moduleId); // Verify module exists

    return this.valueDriverRepo.find({
      where: { moduleId },
      order: { priority: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get a value driver by ID
   */
  async getValueDriver(id: string): Promise<ValueDriverDefinition> {
    const driver = await this.valueDriverRepo.findOne({ where: { id } });
    if (!driver) {
      throw new NotFoundException(`Value driver with ID ${id} not found`);
    }
    return driver;
  }

  /**
   * Create a value driver
   */
  async createValueDriver(
    moduleId: string,
    dto: CreateValueDriverDefinitionDto,
  ): Promise<ValueDriverDefinition> {
    await this.getModule(moduleId); // Verify module exists

    // Validate condition value for regex type
    if (dto.conditionType === 'regex') {
      this.validateRegexPattern(
        typeof dto.conditionValue === 'string'
          ? dto.conditionValue
          : (dto.conditionValue as { pattern?: string }).pattern || '',
      );
    }

    const driver = this.valueDriverRepo.create({
      moduleId,
      name: dto.name,
      description: dto.description || '',
      attribute: dto.attribute,
      conditionType: dto.conditionType,
      conditionValue: dto.conditionValue,
      caseSensitive: dto.caseSensitive ?? false,
      priceMultiplier: dto.priceMultiplier,
      priority: dto.priority ?? 0,
      applicableBrands: dto.applicableBrands || [],
      isActive: true,
    });

    return this.valueDriverRepo.save(driver);
  }

  /**
   * Update a value driver
   */
  async updateValueDriver(
    id: string,
    dto: UpdateValueDriverDefinitionDto,
  ): Promise<ValueDriverDefinition> {
    const driver = await this.getValueDriver(id);

    // Validate regex if updating condition
    if (dto.conditionType === 'regex' || (driver.conditionType === 'regex' && dto.conditionValue)) {
      const pattern =
        typeof dto.conditionValue === 'string'
          ? dto.conditionValue
          : (dto.conditionValue as { pattern?: string })?.pattern ||
            (typeof driver.conditionValue === 'string'
              ? driver.conditionValue
              : (driver.conditionValue as { pattern?: string }).pattern || '');
      this.validateRegexPattern(pattern);
    }

    Object.assign(driver, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.attribute !== undefined && { attribute: dto.attribute }),
      ...(dto.conditionType !== undefined && { conditionType: dto.conditionType }),
      ...(dto.conditionValue !== undefined && { conditionValue: dto.conditionValue }),
      ...(dto.caseSensitive !== undefined && { caseSensitive: dto.caseSensitive }),
      ...(dto.priceMultiplier !== undefined && { priceMultiplier: dto.priceMultiplier }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.applicableBrands !== undefined && { applicableBrands: dto.applicableBrands }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.valueDriverRepo.save(driver);
  }

  /**
   * Delete a value driver
   */
  async deleteValueDriver(id: string): Promise<void> {
    const driver = await this.getValueDriver(id);
    await this.valueDriverRepo.remove(driver);
  }

  /**
   * Reorder value drivers
   */
  async reorderValueDrivers(moduleId: string, orderedIds: string[]): Promise<void> {
    await this.getModule(moduleId); // Verify module exists

    // Update priorities based on order (higher index = lower priority)
    for (let i = 0; i < orderedIds.length; i++) {
      await this.valueDriverRepo.update(
        { id: orderedIds[i], moduleId },
        { priority: orderedIds.length - i },
      );
    }
  }

  /**
   * Validate a regex pattern for safety (basic ReDoS check)
   */
  validateRegexPattern(pattern: string): ValidatePatternResponse {
    if (!pattern) {
      return { valid: true, warnings: [], estimatedComplexity: 'low' };
    }

    const warnings: string[] = [];
    let estimatedComplexity: 'low' | 'medium' | 'high' | 'dangerous' = 'low';

    // Basic length check
    if (pattern.length > 500) {
      return {
        valid: false,
        warnings: ['Pattern too long (max 500 characters)'],
        estimatedComplexity: 'dangerous',
      };
    }

    // Try to compile the regex
    try {
      new RegExp(pattern);
    } catch (e) {
      return {
        valid: false,
        warnings: [`Invalid regex: ${(e as Error).message}`],
        estimatedComplexity: 'dangerous',
      };
    }

    // Basic ReDoS detection: look for nested quantifiers
    const dangerousPatterns = [
      { pattern: /\([^)]*\+[^)]*\)\+/, name: '(a+)+' },
      { pattern: /\([^)]*\*[^)]*\)\*/, name: '(a*)*' },
      { pattern: /\([^)]*\+[^)]*\)\*/, name: '(a+)*' },
      { pattern: /\([^)]*\*[^)]*\)\+/, name: '(a*)+' },
    ];

    for (const dangerous of dangerousPatterns) {
      if (dangerous.pattern.test(pattern)) {
        return {
          valid: false,
          warnings: [`Nested quantifier pattern "${dangerous.name}" detected - may cause ReDoS`],
          estimatedComplexity: 'dangerous',
        };
      }
    }

    // Check complexity indicators
    const quantifierCount = (pattern.match(/[+*?{]/g) || []).length;
    const groupCount = (pattern.match(/\(/g) || []).length;
    const alternationCount = (pattern.match(/\|/g) || []).length;

    if (quantifierCount > 5 || groupCount > 5 || alternationCount > 10) {
      estimatedComplexity = 'high';
      warnings.push('Complex pattern - test with various inputs before using');
    } else if (quantifierCount > 2 || groupCount > 2 || alternationCount > 3) {
      estimatedComplexity = 'medium';
    }

    return { valid: true, warnings, estimatedComplexity };
  }

  // ===========================================================================
  // AUTHENTICITY MARKER CRUD (Sub-Slice 9.1.3)
  // ===========================================================================

  /**
   * List authenticity markers for a module
   */
  async listAuthenticityMarkers(moduleId: string): Promise<AuthenticityMarkerDefinition[]> {
    await this.getModule(moduleId); // Verify module exists

    return this.markerRepo.find({
      where: { moduleId },
      order: { importance: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get an authenticity marker by ID
   */
  async getAuthenticityMarker(id: string): Promise<AuthenticityMarkerDefinition> {
    const marker = await this.markerRepo.findOne({ where: { id } });
    if (!marker) {
      throw new NotFoundException(`Authenticity marker with ID ${id} not found`);
    }
    return marker;
  }

  /**
   * Create an authenticity marker
   */
  async createAuthenticityMarker(
    moduleId: string,
    dto: CreateAuthenticityMarkerDefinitionDto,
  ): Promise<AuthenticityMarkerDefinition> {
    await this.getModule(moduleId); // Verify module exists

    // Validate pattern if provided
    if (dto.pattern) {
      const validation = this.validateRegexPattern(dto.pattern);
      if (!validation.valid) {
        throw new BadRequestException(validation.warnings.join(', '));
      }
    }

    const marker = this.markerRepo.create({
      moduleId,
      name: dto.name,
      checkDescription: dto.checkDescription,
      pattern: dto.pattern || null,
      patternMaxLength: dto.patternMaxLength ?? 50,
      importance: dto.importance,
      indicatesAuthentic: dto.indicatesAuthentic ?? true,
      applicableBrands: dto.applicableBrands || [],
      isActive: true,
    });

    return this.markerRepo.save(marker);
  }

  /**
   * Update an authenticity marker
   */
  async updateAuthenticityMarker(
    id: string,
    dto: UpdateAuthenticityMarkerDefinitionDto,
  ): Promise<AuthenticityMarkerDefinition> {
    const marker = await this.getAuthenticityMarker(id);

    // Validate pattern if updating
    if (dto.pattern !== undefined && dto.pattern !== null) {
      const validation = this.validateRegexPattern(dto.pattern);
      if (!validation.valid) {
        throw new BadRequestException(validation.warnings.join(', '));
      }
    }

    Object.assign(marker, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.checkDescription !== undefined && { checkDescription: dto.checkDescription }),
      ...(dto.pattern !== undefined && { pattern: dto.pattern }),
      ...(dto.patternMaxLength !== undefined && { patternMaxLength: dto.patternMaxLength }),
      ...(dto.importance !== undefined && { importance: dto.importance }),
      ...(dto.indicatesAuthentic !== undefined && { indicatesAuthentic: dto.indicatesAuthentic }),
      ...(dto.applicableBrands !== undefined && { applicableBrands: dto.applicableBrands }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.markerRepo.save(marker);
  }

  /**
   * Delete an authenticity marker
   */
  async deleteAuthenticityMarker(id: string): Promise<void> {
    const marker = await this.getAuthenticityMarker(id);
    await this.markerRepo.remove(marker);
  }

  /**
   * Test an authenticity marker against input
   */
  testAuthenticityMarker(marker: AuthenticityMarkerDefinition, input: string): {
    passed: boolean;
    confidence: number;
    details: string;
  } {
    if (!marker.pattern) {
      return {
        passed: false,
        confidence: 0,
        details: 'Marker has no pattern - requires manual inspection',
      };
    }

    // Enforce max length
    if (input.length > marker.patternMaxLength) {
      return {
        passed: false,
        confidence: 0.3,
        details: `Input too long (${input.length} > ${marker.patternMaxLength})`,
      };
    }

    try {
      const regex = new RegExp(marker.pattern, 'i');
      const matches = regex.test(input);

      if (matches) {
        return {
          passed: marker.indicatesAuthentic,
          confidence: 0.85,
          details: marker.indicatesAuthentic
            ? 'Pattern matched - indicates authentic'
            : 'Pattern matched - indicates suspicious',
        };
      } else {
        return {
          passed: !marker.indicatesAuthentic,
          confidence: 0.6,
          details: marker.indicatesAuthentic
            ? 'Pattern not matched - may indicate fake'
            : 'Pattern not matched - no suspicious indicators',
        };
      }
    } catch (e) {
      return {
        passed: false,
        confidence: 0,
        details: `Pattern error: ${(e as Error).message}`,
      };
    }
  }

  // ===========================================================================
  // DECODER CRUD (Sub-Slice 9.1.4)
  // ===========================================================================

  /**
   * List decoders for a module
   */
  async listDecoders(moduleId: string): Promise<DecoderDefinition[]> {
    await this.getModule(moduleId); // Verify module exists

    return this.decoderRepo.find({
      where: { moduleId },
      order: { priority: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get a decoder by ID
   */
  async getDecoder(id: string): Promise<DecoderDefinition> {
    const decoder = await this.decoderRepo.findOne({ where: { id } });
    if (!decoder) {
      throw new NotFoundException(`Decoder with ID ${id} not found`);
    }
    return decoder;
  }

  /**
   * Create a decoder
   */
  async createDecoder(
    moduleId: string,
    dto: CreateDecoderDefinitionDto,
  ): Promise<DecoderDefinition> {
    await this.getModule(moduleId); // Verify module exists

    // Validate pattern
    const validation = this.validateRegexPattern(dto.inputPattern);
    if (!validation.valid) {
      throw new BadRequestException(validation.warnings.join(', '));
    }

    // Validate lookup table reference if provided
    if (dto.lookupTableId) {
      await this.getLookupTable(dto.lookupTableId);
    }

    const decoder = this.decoderRepo.create({
      moduleId,
      name: dto.name,
      identifierType: dto.identifierType,
      description: dto.description || '',
      inputPattern: dto.inputPattern,
      inputMaxLength: dto.inputMaxLength ?? 50,
      extractionRules: dto.extractionRules,
      lookupTableId: dto.lookupTableId || null,
      lookupKeyGroup: dto.lookupKeyGroup || null,
      validationRules: dto.validationRules || [],
      outputFields: dto.outputFields,
      baseConfidence: dto.baseConfidence ?? 0.9,
      priority: dto.priority ?? 0,
      testCases: dto.testCases || [],
      isActive: true,
    });

    return this.decoderRepo.save(decoder);
  }

  /**
   * Update a decoder
   */
  async updateDecoder(
    id: string,
    dto: UpdateDecoderDefinitionDto,
  ): Promise<DecoderDefinition> {
    const decoder = await this.getDecoder(id);

    // Validate pattern if updating
    if (dto.inputPattern) {
      const validation = this.validateRegexPattern(dto.inputPattern);
      if (!validation.valid) {
        throw new BadRequestException(validation.warnings.join(', '));
      }
    }

    // Validate lookup table reference if updating
    if (dto.lookupTableId) {
      await this.getLookupTable(dto.lookupTableId);
    }

    Object.assign(decoder, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.identifierType !== undefined && { identifierType: dto.identifierType }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.inputPattern !== undefined && { inputPattern: dto.inputPattern }),
      ...(dto.inputMaxLength !== undefined && { inputMaxLength: dto.inputMaxLength }),
      ...(dto.extractionRules !== undefined && { extractionRules: dto.extractionRules }),
      ...(dto.lookupTableId !== undefined && { lookupTableId: dto.lookupTableId }),
      ...(dto.lookupKeyGroup !== undefined && { lookupKeyGroup: dto.lookupKeyGroup }),
      ...(dto.validationRules !== undefined && { validationRules: dto.validationRules }),
      ...(dto.outputFields !== undefined && { outputFields: dto.outputFields }),
      ...(dto.baseConfidence !== undefined && { baseConfidence: dto.baseConfidence }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.testCases !== undefined && { testCases: dto.testCases }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.decoderRepo.save(decoder);
  }

  /**
   * Delete a decoder
   */
  async deleteDecoder(id: string): Promise<void> {
    const decoder = await this.getDecoder(id);
    await this.decoderRepo.remove(decoder);
  }

  /**
   * Test a decoder against input
   */
  async testDecoder(id: string, input: string): Promise<TestDecoderResponse> {
    const decoder = await this.decoderRepo.findOne({
      where: { id },
      relations: ['lookupTable'],
    });

    if (!decoder) {
      throw new NotFoundException(`Decoder with ID ${id} not found`);
    }

    return this.executeDecoder(decoder, input);
  }

  /**
   * Execute a decoder on input (can be used directly without DB lookup)
   */
  async executeDecoder(decoder: DecoderDefinition, input: string): Promise<TestDecoderResponse> {
    const errors: string[] = [];

    // Enforce max length
    if (input.length > decoder.inputMaxLength) {
      return {
        success: false,
        errors: [`Input too long (${input.length} > ${decoder.inputMaxLength})`],
      };
    }

    // Try to match pattern
    let match: RegExpMatchArray | null;
    try {
      const regex = new RegExp(decoder.inputPattern, 'i');
      match = input.trim().toUpperCase().match(regex);
    } catch (e) {
      return {
        success: false,
        errors: [`Pattern error: ${(e as Error).message}`],
      };
    }

    if (!match) {
      return {
        success: false,
        errors: ['Input does not match pattern'],
      };
    }

    // Extract fields from capture groups
    const extracted: Record<string, unknown> = {};
    for (const rule of decoder.extractionRules) {
      const rawValue = match[rule.captureGroup];
      if (rawValue !== undefined) {
        extracted[rule.outputField] = this.applyTransform(rawValue, rule.transform, rule.transformConfig);
      }
    }

    // Apply lookup if configured
    let lookupUsed: { table: string; key: string; values: Record<string, unknown> } | undefined;
    if (decoder.lookupTableId && decoder.lookupKeyGroup) {
      const lookupKey = match[decoder.lookupKeyGroup];
      if (lookupKey) {
        const lookupValues = await this.lookup(decoder.lookupTableId, lookupKey);
        if (lookupValues) {
          Object.assign(extracted, lookupValues);
          lookupUsed = {
            table: decoder.lookupTable?.name || decoder.lookupTableId,
            key: lookupKey,
            values: lookupValues,
          };
        }
      }
    }

    // Run validation rules
    let confidence = Number(decoder.baseConfidence);
    for (const rule of decoder.validationRules) {
      const value = extracted[rule.field];
      const valid = this.validateField(value, rule);
      if (!valid && rule.config.failureConfidence !== undefined) {
        confidence = Math.min(confidence, rule.config.failureConfidence);
        errors.push(rule.config.errorMessage);
      }
    }

    // Build output according to outputFields mapping
    const decoded: Record<string, unknown> = {};
    for (const mapping of decoder.outputFields) {
      const value = extracted[mapping.sourceField];
      if (value !== undefined) {
        decoded[mapping.outputField] = this.castValue(value, mapping.type);
      }
    }

    return {
      success: true,
      decoded,
      confidence,
      lookupUsed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Apply transformation to extracted value
   */
  private applyTransform(
    value: string,
    transform?: string,
    config?: Record<string, unknown>,
  ): unknown {
    switch (transform) {
      case 'parseInt':
        return parseInt(value, 10);
      case 'parseYear': {
        const year = parseInt(value, 10);
        // Handle 2-digit years
        if (year < 100) {
          return year < 50 ? 2000 + year : 1900 + year;
        }
        return year;
      }
      case 'lookup':
        return value; // Lookup handled separately
      default:
        return value;
    }
  }

  /**
   * Validate a field value against a validation rule
   */
  private validateField(value: unknown, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'range': {
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(num)) return false;
        if (rule.config.min !== undefined && num < rule.config.min) return false;
        if (rule.config.max !== undefined && num > rule.config.max) return false;
        return true;
      }
      case 'regex': {
        if (!rule.config.pattern) return true;
        try {
          return new RegExp(rule.config.pattern).test(String(value));
        } catch {
          return false;
        }
      }
      case 'lookup_exists':
        return value !== undefined && value !== null;
      default:
        return true;
    }
  }

  /**
   * Cast a value to the specified type
   */
  private castValue(value: unknown, type: string): unknown {
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value : parseFloat(String(value));
      case 'boolean':
        return Boolean(value);
      default:
        return String(value);
    }
  }

  // ===========================================================================
  // VERSION CONTROL (Sub-Slice 9.1.5)
  // ===========================================================================

  /**
   * List versions for a module
   */
  async listVersions(moduleId: string): Promise<DomainExpertiseVersion[]> {
    await this.getModule(moduleId); // Verify module exists

    return this.versionRepo.find({
      where: { moduleId },
      order: { version: 'DESC' },
      select: ['id', 'moduleId', 'version', 'changelog', 'publishedBy', 'publishedAt', 'isActive'],
    });
  }

  /**
   * Get a version with its snapshot
   */
  async getVersion(id: string): Promise<DomainExpertiseVersion> {
    const version = await this.versionRepo.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    return version;
  }

  /**
   * Publish a module (create a new version)
   */
  async publishModule(
    moduleId: string,
    changelog: string,
    userId: string,
  ): Promise<DomainExpertiseVersion> {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['lookupTables', 'valueDrivers', 'decoders', 'authenticityMarkers'],
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Get all lookup entries for this module's tables
    const lookupEntries: DomainExpertiseSnapshot['lookupEntries'] = [];
    if (module.lookupTables?.length) {
      for (const table of module.lookupTables) {
        const entries = await this.lookupEntryRepo.find({
          where: { tableId: table.id, isActive: true },
        });
        for (const entry of entries) {
          lookupEntries.push({
            id: entry.id,
            tableId: entry.tableId,
            key: entry.key,
            values: entry.values,
          });
        }
      }
    }

    // Create snapshot
    const snapshot: DomainExpertiseSnapshot = {
      module: {
        name: module.name,
        description: module.description,
        categoryId: module.categoryId,
        applicableBrands: module.applicableBrands,
      },
      decoders: (module.decoders || []).filter(d => d.isActive).map(d => ({
        id: d.id,
        name: d.name,
        identifierType: d.identifierType,
        description: d.description,
        inputPattern: d.inputPattern,
        inputMaxLength: d.inputMaxLength,
        extractionRules: d.extractionRules,
        lookupTableId: d.lookupTableId,
        lookupKeyGroup: d.lookupKeyGroup,
        validationRules: d.validationRules,
        outputFields: d.outputFields,
        baseConfidence: Number(d.baseConfidence),
        priority: d.priority,
        testCases: d.testCases,
      })),
      lookupTables: (module.lookupTables || []).filter(t => t.isActive).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        keyField: t.keyField,
        valueSchema: t.valueSchema,
        entryCount: lookupEntries.filter(e => e.tableId === t.id).length,
      })),
      lookupEntries,
      valueDrivers: (module.valueDrivers || []).filter(v => v.isActive).map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
        attribute: v.attribute,
        conditionType: v.conditionType,
        conditionValue: v.conditionValue,
        caseSensitive: v.caseSensitive,
        priceMultiplier: Number(v.priceMultiplier),
        priority: v.priority,
        applicableBrands: v.applicableBrands,
      })),
      authenticityMarkers: (module.authenticityMarkers || []).filter(m => m.isActive).map(m => ({
        id: m.id,
        name: m.name,
        checkDescription: m.checkDescription,
        pattern: m.pattern,
        patternMaxLength: m.patternMaxLength,
        importance: m.importance,
        indicatesAuthentic: m.indicatesAuthentic,
        applicableBrands: m.applicableBrands,
      })),
    };

    // Determine next version number
    const latestVersion = await this.versionRepo.findOne({
      where: { moduleId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    // Deactivate any existing active version
    await this.versionRepo.update(
      { moduleId, isActive: true },
      { isActive: false },
    );

    // Create new version
    const version = this.versionRepo.create({
      moduleId,
      version: nextVersion,
      snapshot,
      changelog,
      publishedBy: userId,
      isActive: true,
    });

    await this.versionRepo.save(version);

    // Update module
    module.currentVersion = nextVersion;
    module.status = 'published';
    module.publishedAt = new Date();
    module.lastModifiedBy = userId;
    await this.moduleRepo.save(module);

    return version;
  }

  /**
   * Rollback a module to a previous version
   */
  async rollbackModule(
    moduleId: string,
    versionId: string,
    userId: string,
    reason?: string,
  ): Promise<DomainExpertiseVersion> {
    const module = await this.getModule(moduleId);
    const targetVersion = await this.getVersion(versionId);

    if (targetVersion.moduleId !== moduleId) {
      throw new BadRequestException('Version does not belong to this module');
    }

    const snapshot = targetVersion.snapshot;

    // Delete current children
    await this.decoderRepo.delete({ moduleId });
    await this.markerRepo.delete({ moduleId });
    await this.valueDriverRepo.delete({ moduleId });

    // Delete lookup entries then tables
    const currentTables = await this.lookupTableRepo.find({ where: { moduleId } });
    for (const table of currentTables) {
      await this.lookupEntryRepo.delete({ tableId: table.id });
    }
    await this.lookupTableRepo.delete({ moduleId });

    // Restore lookup tables and entries
    const tableIdMap = new Map<string, string>(); // old ID -> new ID
    for (const tableData of snapshot.lookupTables) {
      const newTable = this.lookupTableRepo.create({
        moduleId,
        name: tableData.name,
        description: tableData.description,
        keyField: tableData.keyField,
        valueSchema: tableData.valueSchema as LookupValueField[],
        isActive: true,
      });
      const saved = await this.lookupTableRepo.save(newTable);
      tableIdMap.set(tableData.id, saved.id);
    }

    // Restore entries with updated table IDs
    for (const entryData of snapshot.lookupEntries) {
      const newTableId = tableIdMap.get(entryData.tableId);
      if (newTableId) {
        await this.lookupEntryRepo.save(
          this.lookupEntryRepo.create({
            tableId: newTableId,
            key: entryData.key,
            values: entryData.values,
            isActive: true,
          }),
        );
      }
    }

    // Restore decoders
    for (const decoderData of snapshot.decoders) {
      const lookupTableId = decoderData.lookupTableId
        ? tableIdMap.get(decoderData.lookupTableId) || null
        : null;

      await this.decoderRepo.save(
        this.decoderRepo.create({
          moduleId,
          name: decoderData.name,
          identifierType: decoderData.identifierType,
          description: decoderData.description,
          inputPattern: decoderData.inputPattern,
          inputMaxLength: decoderData.inputMaxLength,
          extractionRules: decoderData.extractionRules as ExtractionRule[],
          lookupTableId,
          lookupKeyGroup: decoderData.lookupKeyGroup,
          validationRules: decoderData.validationRules as ValidationRule[],
          outputFields: decoderData.outputFields as OutputFieldMapping[],
          baseConfidence: decoderData.baseConfidence,
          priority: decoderData.priority,
          testCases: decoderData.testCases as DecoderDefinition['testCases'],
          isActive: true,
        }),
      );
    }

    // Restore value drivers
    for (const driverData of snapshot.valueDrivers) {
      await this.valueDriverRepo.save(
        this.valueDriverRepo.create({
          moduleId,
          name: driverData.name,
          description: driverData.description,
          attribute: driverData.attribute,
          conditionType: driverData.conditionType as ValueDriverDefinition['conditionType'],
          conditionValue: driverData.conditionValue,
          caseSensitive: driverData.caseSensitive,
          priceMultiplier: driverData.priceMultiplier,
          priority: driverData.priority,
          applicableBrands: driverData.applicableBrands,
          isActive: true,
        }),
      );
    }

    // Restore authenticity markers
    for (const markerData of snapshot.authenticityMarkers) {
      await this.markerRepo.save(
        this.markerRepo.create({
          moduleId,
          name: markerData.name,
          checkDescription: markerData.checkDescription,
          pattern: markerData.pattern,
          patternMaxLength: markerData.patternMaxLength,
          importance: markerData.importance as AuthenticityMarkerDefinition['importance'],
          indicatesAuthentic: markerData.indicatesAuthentic,
          applicableBrands: markerData.applicableBrands,
          isActive: true,
        }),
      );
    }

    // Create a new version noting the rollback
    const changelog = reason
      ? `Rolled back to version ${targetVersion.version}: ${reason}`
      : `Rolled back to version ${targetVersion.version}`;

    return this.publishModule(moduleId, changelog, userId);
  }

  /**
   * Get module with all relations loaded for testing
   */
  async getModuleForTesting(
    moduleId: string,
  ): Promise<DomainExpertiseModuleEntity & {
    decoders: DecoderDefinition[];
    valueDrivers: ValueDriverDefinition[];
    authenticityMarkers: AuthenticityMarkerDefinition[];
  }> {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['decoders', 'valueDrivers', 'authenticityMarkers'],
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return module as DomainExpertiseModuleEntity & {
      decoders: DecoderDefinition[];
      valueDrivers: ValueDriverDefinition[];
      authenticityMarkers: AuthenticityMarkerDefinition[];
    };
  }

  /**
   * Test decode pipeline with all active decoders
   */
  async testDecodePipeline(
    moduleId: string,
    identifierType: string,
    value: string,
  ): Promise<TestDecoderResponse & { decoderName?: string }> {
    const decoders = await this.decoderRepo.find({
      where: { moduleId, isActive: true },
      relations: ['lookupTable'],
      order: { priority: 'DESC' },
    });

    // Filter by identifier type if specified
    const relevantDecoders = identifierType
      ? decoders.filter(d => d.identifierType === identifierType)
      : decoders;

    for (const decoder of relevantDecoders) {
      const result = await this.executeDecoder(decoder, value);
      if (result.success) {
        return {
          ...result,
          decoderName: decoder.name,
        };
      }
    }

    return {
      success: false,
      errors: ['No decoder matched the input'],
    };
  }

  /**
   * Test value drivers against field values
   */
  async testValueDrivers(
    moduleId: string,
    fields: Record<string, unknown>,
  ): Promise<{
    matches: Array<{
      driver: string;
      driverId: string;
      multiplier: number;
      confidence: number;
      reasoning: string;
    }>;
    combinedMultiplier: number;
  }> {
    const drivers = await this.valueDriverRepo.find({
      where: { moduleId, isActive: true },
      order: { priority: 'DESC' },
    });

    const matches: Array<{
      driver: string;
      driverId: string;
      multiplier: number;
      confidence: number;
      reasoning: string;
    }> = [];

    for (const driver of drivers) {
      const fieldValue = fields[driver.attribute];
      if (fieldValue === undefined || fieldValue === null) continue;

      const stringValue = String(fieldValue);
      let matched = false;
      let reasoning = '';

      switch (driver.conditionType) {
        case 'contains': {
          const searchValue = typeof driver.conditionValue === 'string'
            ? driver.conditionValue
            : '';
          const compareStr = driver.caseSensitive ? stringValue : stringValue.toLowerCase();
          const searchStr = driver.caseSensitive ? searchValue : searchValue.toLowerCase();
          matched = compareStr.includes(searchStr);
          reasoning = matched
            ? `"${driver.attribute}" contains "${searchValue}"`
            : `"${driver.attribute}" does not contain "${searchValue}"`;
          break;
        }
        case 'equals': {
          const targetValue = typeof driver.conditionValue === 'string'
            ? driver.conditionValue
            : '';
          matched = driver.caseSensitive
            ? stringValue === targetValue
            : stringValue.toLowerCase() === targetValue.toLowerCase();
          reasoning = matched
            ? `"${driver.attribute}" equals "${targetValue}"`
            : `"${driver.attribute}" does not equal "${targetValue}"`;
          break;
        }
        case 'regex': {
          const pattern = typeof driver.conditionValue === 'string'
            ? driver.conditionValue
            : (driver.conditionValue as { pattern?: string }).pattern || '';
          try {
            const flags = driver.caseSensitive ? '' : 'i';
            matched = new RegExp(pattern, flags).test(stringValue);
            reasoning = matched
              ? `"${driver.attribute}" matches pattern "${pattern}"`
              : `"${driver.attribute}" does not match pattern "${pattern}"`;
          } catch {
            reasoning = `Invalid regex pattern: ${pattern}`;
          }
          break;
        }
        case 'range': {
          const config = driver.conditionValue as { min?: number; max?: number };
          const numValue = parseFloat(stringValue);
          if (!isNaN(numValue)) {
            const minOk = config.min === undefined || numValue >= config.min;
            const maxOk = config.max === undefined || numValue <= config.max;
            matched = minOk && maxOk;
            reasoning = matched
              ? `"${driver.attribute}" (${numValue}) is within range`
              : `"${driver.attribute}" (${numValue}) is outside range`;
          }
          break;
        }
      }

      if (matched) {
        matches.push({
          driver: driver.name,
          driverId: driver.id,
          multiplier: Number(driver.priceMultiplier),
          confidence: 0.85,
          reasoning,
        });
      }
    }

    // Calculate combined multiplier (multiplicative with diminishing returns)
    let combinedMultiplier = 1.0;
    const sortedMatches = [...matches].sort((a, b) => b.multiplier - a.multiplier);
    for (let i = 0; i < sortedMatches.length; i++) {
      const m = sortedMatches[i];
      if (i === 0) {
        combinedMultiplier *= 1 + (m.multiplier - 1) * m.confidence;
      } else {
        combinedMultiplier *= 1 + Math.sqrt(m.multiplier - 1) * m.confidence * 0.7;
      }
    }
    combinedMultiplier = Math.min(15.0, combinedMultiplier);

    return { matches, combinedMultiplier };
  }

  /**
   * Test authenticity markers against input
   */
  async testAuthenticity(
    moduleId: string,
    identifiers: Array<{ type: string; value: string }>,
    extractedText: string[],
  ): Promise<TestAuthenticityResponse> {
    const markers = await this.markerRepo.find({
      where: { moduleId, isActive: true },
      order: { importance: 'ASC' },
    });

    const markersChecked: TestAuthenticityResponse['markersChecked'] = [];
    const warnings: string[] = [];

    // Test each marker
    for (const marker of markers) {
      // Find a value to test against
      let testValue: string | undefined;

      // Check if any identifier matches the marker's pattern context
      for (const id of identifiers) {
        if (marker.pattern) {
          testValue = id.value;
          break;
        }
      }

      // Fall back to checking extracted text
      if (!testValue && extractedText.length > 0) {
        testValue = extractedText.join(' ');
      }

      if (testValue) {
        const result = this.testAuthenticityMarker(marker, testValue);
        markersChecked.push({
          marker: marker.name,
          markerId: marker.id,
          passed: result.passed,
          confidence: result.confidence,
          details: result.details,
          checkedValue: testValue,
        });
      } else {
        markersChecked.push({
          marker: marker.name,
          markerId: marker.id,
          passed: false,
          confidence: 0,
          details: 'No value to test against',
        });
        if (marker.importance === 'critical') {
          warnings.push(`Critical marker "${marker.name}" could not be tested`);
        }
      }
    }

    // Calculate assessment
    const criticalMarkers = markersChecked.filter(
      m => markers.find(mk => mk.id === m.markerId)?.importance === 'critical',
    );
    const criticalFailed = criticalMarkers.some(m => !m.passed && m.confidence > 0);

    let assessment: TestAuthenticityResponse['assessment'];
    let confidence: number;

    if (criticalFailed) {
      assessment = 'likely_fake';
      confidence = 0.3;
    } else {
      const passedCount = markersChecked.filter(m => m.passed).length;
      const testedCount = markersChecked.filter(m => m.confidence > 0).length;
      const passRate = testedCount > 0 ? passedCount / testedCount : 0;

      if (testedCount === 0) {
        assessment = 'insufficient_data';
        confidence = 0;
      } else if (passRate >= 0.8) {
        assessment = 'likely_authentic';
        confidence = 0.7 + passRate * 0.2;
      } else if (passRate >= 0.5) {
        assessment = 'uncertain';
        confidence = 0.4 + passRate * 0.2;
      } else {
        assessment = 'likely_fake';
        confidence = passRate * 0.4;
      }
    }

    return {
      assessment,
      confidence,
      markersChecked,
      warnings,
    };
  }
}
