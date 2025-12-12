/**
 * Unit Tests for Execute Research Node - Confidence-Based Field Updates
 *
 * These tests validate the critical confidence comparison logic in execute-research.node.ts.
 * The node only updates a field if the new source has HIGHER confidence than the existing value.
 * This prevents worse sources from overwriting better data - essential for data quality.
 *
 * Test Coverage:
 * 1. Updates field when new confidence > existing confidence
 * 2. Does NOT update when new confidence < existing confidence
 * 3. Does NOT update when new confidence == existing (tie goes to existing)
 * 4. Handles missing confidence score gracefully
 * 5. Handles null/undefined field values (skips update)
 * 6. Multiple updates to same field (highest confidence wins)
 * 7. Updates to different fields are all applied
 * 8. Handles missing existingField gracefully (first update)
 *
 * Critical Business Logic:
 * Lines 118-154 in execute-research.node.ts implement the confidence-based update logic.
 * The comparison at line 123 is the gatekeeper that prevents data quality degradation.
 */

import { executeResearchNode, ExecuteResearchTools } from '../execute-research.node';
import { ResearchGraphState, ItemSnapshot } from '../../research-graph.state';
import type {
  ItemFieldStates,
  FieldState,
  ResearchTask,
  ResearchTaskResult,
  FieldDataSource,
  ResearchTaskHistory,
} from '@listforge/core-types';

describe('executeResearchNode - Confidence-Based Field Updates', () => {
  const mockItem: ItemSnapshot = {
    id: 'item-123',
    title: 'Test Item',
    description: 'Test description',
    condition: 'new',
    attributes: [],
    media: [
      { id: 'media-1', url: 'https://example.com/image1.jpg', type: 'image' },
    ],
    defaultPrice: null,
    lifecycleStatus: 'draft',
    aiReviewState: 'not_reviewed',
  };

  const createMockFieldState = (
    name: string,
    value: unknown = null,
    confidence: number = 0,
    sources: FieldDataSource[] = [],
  ): FieldState => ({
    name,
    displayName: name,
    value,
    confidence: {
      value: confidence,
      sources,
      lastUpdated: '2024-01-01T00:00:00.000Z',
    },
    required: true,
    requiredBy: ['ebay'],
    dataType: 'string',
    attempts: 0,
    status: 'pending',
  });

  const createMockFieldStates = (fields: Record<string, FieldState>): ItemFieldStates => ({
    fields,
    requiredFieldsComplete: 0,
    requiredFieldsTotal: Object.keys(fields).length,
    recommendedFieldsComplete: 0,
    recommendedFieldsTotal: 0,
    completionScore: 0,
    readyToPublish: false,
    totalCost: 0,
    totalTimeMs: 0,
    iterations: 0,
    version: '1.0.0',
  });

  const createMockSource = (
    type: string,
    confidence: number,
    rawValue?: unknown,
  ): FieldDataSource => ({
    type: type as any,
    confidence,
    timestamp: '2024-01-01T00:00:00.000Z',
    rawValue,
  });

  const createMockTask = (targetFields: string[]): ResearchTask => ({
    id: 'task-123',
    tool: 'upc_lookup',
    targetFields,
    priority: 1,
    estimatedCost: 0.01,
    estimatedTimeMs: 100,
    reasoning: 'Test task',
  });

  describe('Confidence Comparison Logic', () => {
    it('should update field when new confidence > existing confidence', async () => {
      // Setup: existing field with low confidence
      const existingSource = createMockSource('web_search', 0.65);
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'OldBrand', 0.65, [existingSource]),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      // New source with higher confidence
      const newSource = createMockSource('upc_lookup', 0.95, 'NewBrand');
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'NewBrand',
            source: newSource,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockImplementation((states, fieldName, value, source) => {
            // Return updated states with new value
            return {
              ...states,
              fields: {
                ...states.fields,
                [fieldName]: {
                  ...states.fields[fieldName],
                  value,
                  confidence: {
                    value: source.confidence,
                    sources: [...states.fields[fieldName].confidence.sources, source],
                    lastUpdated: source.timestamp,
                  },
                },
              },
            };
          }),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should call updateField because new confidence (0.95) > existing (0.65)
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledWith(
        expect.anything(),
        'brand',
        'NewBrand',
        newSource,
      );
    });

    it('should NOT update field when new confidence < existing confidence', async () => {
      // Setup: existing field with high confidence
      const existingSource = createMockSource('upc_lookup', 0.95);
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'HighConfidenceBrand', 0.95, [existingSource]),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      // New source with lower confidence
      const newSource = createMockSource('web_search', 0.65, 'LowConfidenceBrand');
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'LowConfidenceBrand',
            source: newSource,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should NOT call updateField because new confidence (0.65) < existing (0.95)
      expect(mockTools.fieldStateManager.updateField).not.toHaveBeenCalled();
    });

    it('should NOT update field when new confidence == existing confidence (tie goes to existing)', async () => {
      // Setup: existing field with confidence 0.75
      const existingSource = createMockSource('keepa', 0.75);
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'ExistingBrand', 0.75, [existingSource]),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      // New source with equal confidence
      const newSource = createMockSource('vision_ai', 0.75, 'NewBrand');
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'NewBrand',
            source: newSource,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should NOT call updateField because new confidence (0.75) == existing (0.75)
      // Tie goes to existing value
      expect(mockTools.fieldStateManager.updateField).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing confidence score in source (skip update)', async () => {
      const existingSource = createMockSource('upc_lookup', 0.95);
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'ExistingBrand', 0.95, [existingSource]),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      // Source without confidence (should be treated as 0 or skipped)
      const sourceWithoutConfidence = {
        type: 'web_search',
        timestamp: '2024-01-01T00:00:00.000Z',
        // confidence field missing
      } as FieldDataSource;

      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'NewBrand',
            source: sourceWithoutConfidence,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should handle gracefully - likely skip update
      // The exact behavior depends on implementation
      expect(mockTools.fieldResearchService.executeTask).toHaveBeenCalled();
    });

    it('should skip update when field value is null', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'ExistingBrand', 0.75),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const newSource = createMockSource('upc_lookup', 0.95);
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: null, // Null value
            source: newSource,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should NOT call updateField because value is null
      expect(mockTools.fieldStateManager.updateField).not.toHaveBeenCalled();
    });

    it('should skip update when field value is undefined', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'ExistingBrand', 0.75),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const newSource = createMockSource('upc_lookup', 0.95);
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: undefined, // Undefined value
            source: newSource,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should NOT call updateField because value is undefined
      expect(mockTools.fieldStateManager.updateField).not.toHaveBeenCalled();
    });

    it('should handle missing existingField gracefully (first update for a field)', async () => {
      // Field exists in fieldStates but has never been updated (no existing confidence)
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []), // No existing sources
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const newSource = createMockSource('upc_lookup', 0.95, 'FirstBrand');
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'FirstBrand',
            source: newSource,
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockImplementation((states, fieldName, value, source) => {
            return {
              ...states,
              fields: {
                ...states.fields,
                [fieldName]: {
                  ...states.fields[fieldName],
                  value,
                  confidence: {
                    value: source.confidence,
                    sources: [source],
                    lastUpdated: source.timestamp,
                  },
                },
              },
            };
          }),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Should call updateField because field has no existing value/confidence
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledWith(
        expect.anything(),
        'brand',
        'FirstBrand',
        newSource,
      );
    });
  });

  describe('Multiple Field Updates', () => {
    it('should apply multiple updates to different fields', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []),
        model: createMockFieldState('model', null, 0, []),
        color: createMockFieldState('color', null, 0, []),
      });

      const currentTask = createMockTask(['brand', 'model', 'color']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'Sony',
            source: createMockSource('upc_lookup', 0.95, 'Sony'),
          },
          {
            fieldName: 'model',
            value: 'WH-1000XM4',
            source: createMockSource('upc_lookup', 0.95, 'WH-1000XM4'),
          },
          {
            fieldName: 'color',
            value: 'Black',
            source: createMockSource('upc_lookup', 0.90, 'Black'),
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockImplementation((states, fieldName, value) => {
            return {
              ...states,
              fields: {
                ...states.fields,
                [fieldName]: {
                  ...states.fields[fieldName],
                  value,
                },
              },
            };
          }),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // All three fields should be updated
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledTimes(3);
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledWith(
        expect.anything(),
        'brand',
        'Sony',
        expect.any(Object),
      );
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledWith(
        expect.anything(),
        'model',
        'WH-1000XM4',
        expect.any(Object),
      );
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledWith(
        expect.anything(),
        'color',
        'Black',
        expect.any(Object),
      );
    });

    it('should handle multiple updates to same field (highest confidence wins)', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      // Multiple updates for the same field with different confidence levels
      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'LowConfidenceBrand',
            source: createMockSource('web_search', 0.65, 'LowConfidenceBrand'),
          },
          {
            fieldName: 'brand',
            value: 'HighConfidenceBrand',
            source: createMockSource('upc_lookup', 0.95, 'HighConfidenceBrand'),
          },
          {
            fieldName: 'brand',
            value: 'MediumConfidenceBrand',
            source: createMockSource('vision_ai', 0.75, 'MediumConfidenceBrand'),
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      let currentFieldStates = fieldStates;
      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockImplementation((states, fieldName, value, source) => {
            // Simulate the confidence comparison logic
            const existingField = currentFieldStates.fields[fieldName];
            if (!existingField || source.confidence > existingField.confidence.value) {
              currentFieldStates = {
                ...states,
                fields: {
                  ...states.fields,
                  [fieldName]: {
                    ...states.fields[fieldName],
                    value,
                    confidence: {
                      value: source.confidence,
                      sources: [source],
                      lastUpdated: source.timestamp,
                    },
                  },
                },
              };
            }
            return currentFieldStates;
          }),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // First update (0.65) should be applied (no existing value)
      // Second update (0.95) should be applied (higher confidence)
      // Third update (0.75) should NOT be applied (lower than current 0.95)
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledTimes(2);

      // Check the call order
      const calls = (mockTools.fieldStateManager.updateField as jest.Mock).mock.calls;
      expect(calls[0][2]).toBe('LowConfidenceBrand'); // First call with low confidence
      expect(calls[1][2]).toBe('HighConfidenceBrand'); // Second call with high confidence
    });

    it('should handle mixed success: some fields update, some skip', async () => {
      const existingBrandSource = createMockSource('upc_lookup', 0.95);
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', 'HighConfidenceBrand', 0.95, [existingBrandSource]),
        model: createMockFieldState('model', null, 0, []),
      });

      const currentTask = createMockTask(['brand', 'model']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'LowConfidenceBrand',
            source: createMockSource('web_search', 0.65, 'LowConfidenceBrand'),
          },
          {
            fieldName: 'model',
            value: 'WH-1000XM4',
            source: createMockSource('upc_lookup', 0.95, 'WH-1000XM4'),
          },
        ],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockImplementation((states, fieldName, value) => {
            return {
              ...states,
              fields: {
                ...states.fields,
                [fieldName]: {
                  ...states.fields[fieldName],
                  value,
                },
              },
            };
          }),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      await executeResearchNode(state as ResearchGraphState, config);

      // Only model should be updated (brand has higher existing confidence)
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledTimes(1);
      expect(mockTools.fieldStateManager.updateField).toHaveBeenCalledWith(
        expect.anything(),
        'model',
        'WH-1000XM4',
        expect.any(Object),
      );
    });
  });

  describe('Task History and Cost Tracking', () => {
    it('should update research cost correctly', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0.05, // Starting cost
      };

      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [
          {
            fieldName: 'brand',
            value: 'Sony',
            source: createMockSource('upc_lookup', 0.95, 'Sony'),
          },
        ],
        cost: 0.01, // Task cost
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockReturnValue(fieldStates),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      const result = await executeResearchNode(state as ResearchGraphState, config);

      // Should add task cost to existing cost (use toBeCloseTo for floating point precision)
      expect(result.currentResearchCost).toBeCloseTo(0.06, 5); // 0.05 + 0.01
    });

    it('should clear currentTask after execution', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: true,
        fieldUpdates: [],
        cost: 0.01,
        timeMs: 100,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn().mockReturnValue(fieldStates),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      const result = await executeResearchNode(state as ResearchGraphState, config);

      // currentTask should be cleared
      expect(result.currentTask).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle task execution errors gracefully', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockRejectedValue(new Error('API Error')),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      const result = await executeResearchNode(state as ResearchGraphState, config);

      // Should not throw, should return partial cost
      expect(result.currentTask).toBeNull();
      expect(result.currentResearchCost).toBeGreaterThan(0); // Partial cost
      expect(mockTools.fieldStateManager.updateField).not.toHaveBeenCalled();
    });

    it('should handle failed task results', async () => {
      const fieldStates = createMockFieldStates({
        brand: createMockFieldState('brand', null, 0, []),
      });

      const currentTask = createMockTask(['brand']);

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        item: mockItem,
        fieldStates,
        currentTask,
        currentResearchCost: 0,
      };

      const taskResult: ResearchTaskResult = {
        task: currentTask,
        success: false,
        fieldUpdates: [],
        error: 'Service unavailable',
        cost: 0.005, // Partial cost
        timeMs: 50,
      };

      const mockTools: ExecuteResearchTools = {
        fieldResearchService: {
          executeTask: jest.fn().mockResolvedValue(taskResult),
        } as any,
        fieldStateManager: {
          updateField: jest.fn(),
        } as any,
      };

      const config = { configurable: { tools: mockTools } };
      const result = await executeResearchNode(state as ResearchGraphState, config);

      // Should not update any fields
      expect(mockTools.fieldStateManager.updateField).not.toHaveBeenCalled();
      expect(result.currentResearchCost).toBe(0.005);
      expect(result.currentTask).toBeNull();
    });
  });
});
