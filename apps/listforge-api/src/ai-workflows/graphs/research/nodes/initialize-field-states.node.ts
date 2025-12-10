import { ResearchGraphState, ItemSnapshot } from '../research-graph.state';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchPlannerService, ResearchContext } from '../../../services/research-planner.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { MarketplaceSchemaService } from '../../../services/marketplace-schema.service';
import { KeepaService } from '../../../services/keepa.service';
import { UPCLookupService } from '../../../services/upc-lookup.service';
import type { ItemFieldStates, FieldRequirement, ResearchConstraints } from '@listforge/core-types';

/**
 * Tools interface for initialize_field_states node
 */
export interface InitializeFieldStatesTools {
  fieldStateManager: FieldStateManagerService;
  researchPlanner: ResearchPlannerService;
  marketplaceSchema?: MarketplaceSchemaService;
  keepaService?: KeepaService;
  upcLookupService?: UPCLookupService;
}

/**
 * Extract UPC from item snapshot
 */
function extractUpcFromItem(item: ItemSnapshot | null): string | undefined {
  if (!item) return undefined;

  // Check attributes for UPC
  const upcAttr = item.attributes?.find(
    a => a.key.toLowerCase() === 'upc' || a.key.toLowerCase() === 'ean',
  );
  if (upcAttr?.value) {
    return upcAttr.value;
  }

  return undefined;
}

/**
 * Extract brand from item snapshot
 */
function extractBrandFromItem(item: ItemSnapshot | null): string | undefined {
  if (!item) return undefined;

  const brandAttr = item.attributes?.find(a => a.key.toLowerCase() === 'brand');
  return brandAttr?.value;
}

/**
 * Extract model from item snapshot
 */
function extractModelFromItem(item: ItemSnapshot | null): string | undefined {
  if (!item) return undefined;

  const modelAttr = item.attributes?.find(
    a => a.key.toLowerCase() === 'model' || a.key.toLowerCase() === 'model number',
  );
  return modelAttr?.value;
}

/**
 * Initialize Field States Node
 *
 * This node:
 * 1. Detects target marketplace requirements (eBay categories)
 * 2. Initializes field states based on requirements
 * 3. Sets up research context with available data sources
 * 4. Configures research constraints based on mode
 */
export async function initializeFieldStatesNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: InitializeFieldStatesTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.fieldStateManager || !tools?.researchPlanner) {
    throw new Error(
      'FieldStateManagerService and ResearchPlannerService are required in config.configurable.tools',
    );
  }

  // Start operation logging
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'initialize_field_states',
      title: 'Initializing Field States',
      message: 'Setting up field tracking and marketplace requirements',
      stepId: 'initialize_field_states',
    });
  }

  try {
    const item = state.item;
    if (!item) {
      throw new Error('Item not loaded - must run load_context first');
    }

    // Determine research mode (default to balanced)
    const researchMode = state.researchMode || 'balanced';

    // Get research constraints for the mode
    const constraints = tools.researchPlanner.getDefaultConstraints(researchMode);

    // Gather field requirements
    // Start with required and recommended fields from state
    const requiredFields = state.requiredFields || [];
    const recommendedFields = state.recommendedFields || [];

    // If we have marketplace schema service and a category, get category-specific requirements
    let marketplaceRequirements: FieldRequirement[] = [];
    if (tools.marketplaceSchema && state.marketplaceCategory) {
      // Category requirements would be fetched here
      // For now, use the requirements already in state
      marketplaceRequirements = [...requiredFields, ...recommendedFields];
    }

    // Extract existing values from item
    const existingValues: Record<string, unknown> = {};

    // Map item properties to field values
    if (item.title) existingValues.title = item.title;
    if (item.description) existingValues.description = item.description;
    if (item.condition) existingValues.condition = item.condition;
    if (item.defaultPrice) existingValues.price = item.defaultPrice;

    // Extract from attributes
    for (const attr of item.attributes || []) {
      const normalizedKey = attr.key.toLowerCase().replace(/\s+/g, '_');
      existingValues[normalizedKey] = attr.value;
    }

    // Extract identifiers
    const upc = extractUpcFromItem(item);
    const brand = extractBrandFromItem(item);
    const model = extractModelFromItem(item);

    if (upc) existingValues.upc = upc;
    if (brand) existingValues.brand = brand;
    if (model) existingValues.model = model;

    // Determine available data sources
    const hasImages = (item.media?.length || 0) > 0;
    const imageCount = item.media?.filter(m => m.type === 'image').length || 0;

    // Check service availability
    const keepaConfigured = tools.keepaService?.isServiceConfigured() ?? false;
    const upcDatabaseConfigured = true; // UPC lookup service is always available (may be rate limited)
    const amazonConfigured = keepaConfigured; // Amazon catalog uses Keepa for now

    // Build research context
    const researchContext: ResearchContext = {
      hasUpc: !!upc,
      hasBrand: !!brand,
      hasModel: !!model,
      hasCategory: !!state.marketplaceCategory,
      hasImages,
      imageCount,
      keepaConfigured,
      amazonConfigured,
      upcDatabaseConfigured,
    };

    // Initialize field states
    // Convert existingValues to ItemForFieldInit format
    // Extract category from marketplace category if available
    const categoryPath = state.marketplaceCategory?.categoryPath || null;
    const itemForInit = {
      title: existingValues.title as string | undefined,
      description: existingValues.description as string | undefined,
      condition: existingValues.condition as string | undefined,
      categoryPath,
      attributes: Object.entries(existingValues)
        .filter(([k]) => !['title', 'description', 'condition', 'price'].includes(k))
        .map(([key, value]) => ({ key, value: String(value) })),
      defaultPrice: existingValues.price as number | undefined,
    };

    const fieldStates = tools.fieldStateManager.initializeFieldStates(
      requiredFields,
      recommendedFields,
      itemForInit,
      ['ebay'], // Default target marketplace
    );

    // Calculate initial completion score
    const summary = tools.fieldStateManager.getSummary(fieldStates);

    // Log progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'initialize_field_states',
        message: `Initialized ${Object.keys(fieldStates.fields).length} fields`,
        stepId: 'initialize_field_states',
        data: {
          totalFields: Object.keys(fieldStates.fields).length,
          requiredFieldsComplete: summary.requiredFieldsComplete,
          requiredFieldsTotal: summary.requiredFieldsTotal,
          completionScore: summary.completionScore,
          researchMode,
        },
      });
    }

    // Complete operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'initialize_field_states',
        title: 'Initializing Field States',
        message: `Ready to research: ${summary.requiredFieldsComplete}/${summary.requiredFieldsTotal} required fields complete`,
        stepId: 'initialize_field_states',
        data: {
          completionScore: summary.completionScore,
          readyToPublish: summary.readyToPublish,
          fieldsNeedingResearch: summary.fieldsNeedingResearch.length,
          researchContext,
        },
      });
    }

    return {
      fieldStates,
      researchConstraints: constraints,
      researchMode,
      researchContext,
      currentResearchCost: 0,
      iteration: 0,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'initialize_field_states',
        title: 'Initializing Field States',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'initialize_field_states',
      });
    }
    throw error;
  }
}
