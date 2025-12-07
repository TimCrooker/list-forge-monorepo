import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ItemsService } from '../../items/items.service';
import { ItemDto, UpdateItemRequest } from '@listforge/api-types';
import { ResearchService } from '../../research/research.service';
import { Queue } from 'bullmq';
import { QUEUE_AI_WORKFLOW, StartResearchRunJob } from '@listforge/queue-types';

/**
 * Chat Tools - Phase 7 Slice 6 + Slice 7
 *
 * Tools available to the ChatGraph for performing actions on items and research.
 */

/**
 * Update a single field on an item
 * Validates the field is updatable and applies the change
 */
export async function updateItemField(
  params: {
    itemId: string;
    orgId: string;
    field: string;
    value: unknown;
    userId: string;
  },
  itemsService: ItemsService,
): Promise<{ success: boolean; item: ItemDto; field: string; newValue: unknown }> {
  const { itemId, orgId, field, userId } = params;
  let { value } = params;

  // Validate field is updatable
  const updatableFields = [
    'title',
    'subtitle',
    'description',
    'condition',
    'defaultPrice',
    'quantity',
    'currency',
    'priceMin',
    'priceMax',
    'pricingStrategy',
    'shippingType',
    'flatRateAmount',
    'domesticOnly',
    'weight',
    'dimensions',
    'location',
    'costBasis',
    'tags',
    'categoryPath',
    'categoryId',
    'attributes',
    'userNotes',
  ];

  if (!updatableFields.includes(field)) {
    throw new BadRequestException(
      `Field "${field}" is not updatable. Allowed fields: ${updatableFields.join(', ')}`,
    );
  }

  // Validate value based on field type
  if (field === 'defaultPrice' || field === 'priceMin' || field === 'priceMax' || field === 'flatRateAmount' || field === 'costBasis') {
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue) || numValue < 0) {
      throw new BadRequestException(`Invalid value for ${field}: must be a positive number`);
    }
    value = numValue;
  }

  if (field === 'quantity') {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    if (isNaN(numValue) || numValue < 1 || !Number.isInteger(numValue)) {
      throw new BadRequestException(`Invalid value for quantity: must be a positive integer`);
    }
    value = numValue;
  }

  if (field === 'domesticOnly') {
    value = value === true || value === 'true' || value === '1';
  }

  // Build update request
  const updateRequest: UpdateItemRequest = {
    [field]: value,
  };

  // Update via ItemsService
  const updatedItem = await itemsService.updateItem(orgId, itemId, updateRequest);

  return {
    success: true,
    item: updatedItem,
    field,
    newValue: value,
  };
}

/**
 * Start a research job for an item
 * Phase 7 Slice 7
 */
export async function startResearchJob(
  params: {
    itemId: string;
    orgId: string;
    userId: string;
    runType?: 'initial_intake' | 'pricing_refresh' | 'manual_request';
  },
  researchService: ResearchService,
  aiWorkflowQueue: Queue,
): Promise<{ jobId: string; status: string }> {
  const { itemId, orgId, userId, runType = 'manual_request' } = params;

  // Create research run
  const researchRun = await researchService.createResearchRun(itemId, orgId, runType);

  // Enqueue AI workflow job
  const job: StartResearchRunJob = {
    researchRunId: researchRun.id,
    itemId,
    runType,
    orgId,
    userId,
  };
  await aiWorkflowQueue.add('start-research-run', job);

  return {
    jobId: researchRun.id,
    status: 'queued',
  };
}

/**
 * Check if research is stale (>7 days old)
 * Phase 7 Slice 7
 */
export async function isResearchStale(
  params: { itemId: string; orgId: string },
  researchService: ResearchService,
): Promise<boolean> {
  const { itemId, orgId } = params;

  const research = await researchService.findLatestResearch(itemId, orgId);
  if (!research) {
    return true; // No research = considered stale
  }

  const researchDate = new Date(research.data.generatedAt);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return researchDate < sevenDaysAgo;
}
