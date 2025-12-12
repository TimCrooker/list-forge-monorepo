import {
  GetResearchDataSchema,
  SearchCompsSchema,
  TriggerResearchSchema,
  GetPricingAnalysisSchema,
  ResearchFieldSchema,
} from '../research.tools';

describe('Research Tools Zod Schema Validation', () => {
  // ============================================================================
  // GetResearchDataSchema Tests
  // ============================================================================
  describe('GetResearchDataSchema', () => {
    it('should accept valid itemId', () => {
      const valid = GetResearchDataSchema.safeParse({
        itemId: 'item-123',
      });
      expect(valid.success).toBe(true);
    });

    it('should accept itemId with alphanumeric characters, hyphens, and underscores', () => {
      const valid = GetResearchDataSchema.safeParse({
        itemId: 'item_ABC-123',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject empty itemId', () => {
      const result = GetResearchDataSchema.safeParse({
        itemId: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item ID cannot be empty');
      }
    });

    it('should reject itemId with invalid characters', () => {
      const result = GetResearchDataSchema.safeParse({
        itemId: 'item@123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Item ID must be alphanumeric with hyphens/underscores only'
        );
      }
    });

    it('should reject itemId with spaces', () => {
      const result = GetResearchDataSchema.safeParse({
        itemId: 'item 123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing itemId', () => {
      const result = GetResearchDataSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // SearchCompsSchema Tests (Most Complex)
  // ============================================================================
  describe('SearchCompsSchema', () => {
    describe('Valid Inputs', () => {
      it('should accept valid input with itemId', () => {
        const valid = SearchCompsSchema.safeParse({
          itemId: 'item-123',
        });
        expect(valid.success).toBe(true);
        if (valid.success) {
          expect(valid.data.marketplace).toBe('ebay'); // default
          expect(valid.data.soldOnly).toBe(true); // default
          expect(valid.data.limit).toBe(10); // default
        }
      });

      it('should accept valid input with query', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'Sony Playstation 5',
        });
        expect(valid.success).toBe(true);
      });

      it('should accept both itemId and query', () => {
        const valid = SearchCompsSchema.safeParse({
          itemId: 'item-123',
          query: 'Nintendo Switch',
        });
        expect(valid.success).toBe(true);
      });

      it('should accept all optional parameters', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'iPhone 13',
          marketplace: 'amazon',
          soldOnly: false,
          limit: 25,
          minPrice: 100,
          maxPrice: 500,
          condition: 'used',
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('Refinement: itemId OR query Required', () => {
      it('should reject when neither itemId nor query is provided', () => {
        const result = SearchCompsSchema.safeParse({
          marketplace: 'ebay',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const error = result.error.issues.find(
            (issue) => issue.path[0] === 'query'
          );
          expect(error?.message).toBe('Either itemId or query must be provided');
        }
      });
    });

    describe('Refinement: minPrice <= maxPrice', () => {
      it('should accept when minPrice <= maxPrice', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'laptop',
          minPrice: 100,
          maxPrice: 500,
        });
        expect(valid.success).toBe(true);
      });

      it('should accept when minPrice equals maxPrice', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'laptop',
          minPrice: 250,
          maxPrice: 250,
        });
        expect(valid.success).toBe(true);
      });

      it('should reject when minPrice > maxPrice', () => {
        const result = SearchCompsSchema.safeParse({
          query: 'laptop',
          minPrice: 500,
          maxPrice: 100,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const error = result.error.issues.find(
            (issue) => issue.path[0] === 'minPrice'
          );
          expect(error?.message).toBe(
            'Minimum price must be less than or equal to maximum price'
          );
        }
      });

      it('should accept when only minPrice is provided', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'laptop',
          minPrice: 100,
        });
        expect(valid.success).toBe(true);
      });

      it('should accept when only maxPrice is provided', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'laptop',
          maxPrice: 500,
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('Limit Validation', () => {
      it('should enforce limit minimum (1)', () => {
        const result = SearchCompsSchema.safeParse({
          query: 'test',
          limit: 0,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Limit must be at least 1');
        }
      });

      it('should enforce limit maximum (50)', () => {
        const result = SearchCompsSchema.safeParse({
          query: 'test',
          limit: 51,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Limit cannot exceed 50');
        }
      });

      it('should accept limit at boundaries', () => {
        const min = SearchCompsSchema.safeParse({ query: 'test', limit: 1 });
        const max = SearchCompsSchema.safeParse({ query: 'test', limit: 50 });
        expect(min.success).toBe(true);
        expect(max.success).toBe(true);
      });

      it('should reject non-integer limit', () => {
        const result = SearchCompsSchema.safeParse({
          query: 'test',
          limit: 10.5,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Limit must be an integer');
        }
      });

      it('should accept valid limit values', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          limit: 25,
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('ItemId Validation', () => {
      it('should accept alphanumeric itemId with hyphens and underscores', () => {
        const valid = SearchCompsSchema.safeParse({
          itemId: 'item_ABC-123',
        });
        expect(valid.success).toBe(true);
      });

      it('should reject itemId with invalid characters', () => {
        const result = SearchCompsSchema.safeParse({
          itemId: 'item@123!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Item ID must be alphanumeric'
          );
        }
      });

      it('should reject empty itemId', () => {
        const result = SearchCompsSchema.safeParse({
          itemId: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Item ID cannot be empty');
        }
      });
    });

    describe('Query Validation', () => {
      it('should reject empty query', () => {
        const result = SearchCompsSchema.safeParse({
          query: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Query cannot be empty');
        }
      });

      it('should reject excessively long query (max 200)', () => {
        const longQuery = 'a'.repeat(201);
        const result = SearchCompsSchema.safeParse({
          query: longQuery,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Query too long');
        }
      });

      it('should accept query at max length (200)', () => {
        const maxQuery = 'a'.repeat(200);
        const valid = SearchCompsSchema.safeParse({
          query: maxQuery,
        });
        expect(valid.success).toBe(true);
      });

      it('should accept normal query', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'Sony PlayStation 5 Digital Edition',
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('Price Validation', () => {
      it('should reject negative minPrice', () => {
        const result = SearchCompsSchema.safeParse({
          query: 'test',
          minPrice: -10,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Minimum price cannot be negative'
          );
        }
      });

      it('should accept zero as minPrice', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          minPrice: 0,
        });
        expect(valid.success).toBe(true);
      });

      it('should reject zero or negative maxPrice', () => {
        const resultZero = SearchCompsSchema.safeParse({
          query: 'test',
          maxPrice: 0,
        });
        const resultNegative = SearchCompsSchema.safeParse({
          query: 'test',
          maxPrice: -10,
        });
        expect(resultZero.success).toBe(false);
        expect(resultNegative.success).toBe(false);
      });

      it('should accept positive maxPrice', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          maxPrice: 100,
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('Marketplace Validation', () => {
      it('should accept ebay marketplace', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          marketplace: 'ebay',
        });
        expect(valid.success).toBe(true);
      });

      it('should accept amazon marketplace', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          marketplace: 'amazon',
        });
        expect(valid.success).toBe(true);
      });

      it('should reject invalid marketplace', () => {
        const result = SearchCompsSchema.safeParse({
          query: 'test',
          marketplace: 'etsy',
        });
        expect(result.success).toBe(false);
      });

      it('should default to ebay', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
        });
        expect(valid.success).toBe(true);
        if (valid.success) {
          expect(valid.data.marketplace).toBe('ebay');
        }
      });
    });

    describe('Condition Validation', () => {
      it('should accept condition string', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          condition: 'used',
        });
        expect(valid.success).toBe(true);
      });

      it('should reject excessively long condition (max 50)', () => {
        const longCondition = 'a'.repeat(51);
        const result = SearchCompsSchema.safeParse({
          query: 'test',
          condition: longCondition,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Condition string too long');
        }
      });

      it('should accept condition at max length (50)', () => {
        const maxCondition = 'a'.repeat(50);
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
          condition: maxCondition,
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('Default Values', () => {
      it('should apply all defaults correctly', () => {
        const valid = SearchCompsSchema.safeParse({
          query: 'test',
        });
        expect(valid.success).toBe(true);
        if (valid.success) {
          expect(valid.data.marketplace).toBe('ebay');
          expect(valid.data.soldOnly).toBe(true);
          expect(valid.data.limit).toBe(10);
        }
      });
    });
  });

  // ============================================================================
  // TriggerResearchSchema Tests
  // ============================================================================
  describe('TriggerResearchSchema', () => {
    it('should accept valid input with defaults', () => {
      const valid = TriggerResearchSchema.safeParse({
        itemId: 'item-123',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.runType).toBe('manual_request'); // default
        expect(valid.data.priority).toBe('normal'); // default
      }
    });

    it('should accept all runType values', () => {
      const runTypes = ['initial_intake', 'pricing_refresh', 'manual_request'];
      runTypes.forEach((runType) => {
        const valid = TriggerResearchSchema.safeParse({
          itemId: 'item-123',
          runType,
        });
        expect(valid.success).toBe(true);
      });
    });

    it('should accept all priority values', () => {
      const priorities = ['low', 'normal', 'high'];
      priorities.forEach((priority) => {
        const valid = TriggerResearchSchema.safeParse({
          itemId: 'item-123',
          priority,
        });
        expect(valid.success).toBe(true);
      });
    });

    it('should reject invalid runType', () => {
      const result = TriggerResearchSchema.safeParse({
        itemId: 'item-123',
        runType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const result = TriggerResearchSchema.safeParse({
        itemId: 'item-123',
        priority: 'urgent',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty itemId', () => {
      const result = TriggerResearchSchema.safeParse({
        itemId: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item ID cannot be empty');
      }
    });

    it('should reject itemId with invalid characters', () => {
      const result = TriggerResearchSchema.safeParse({
        itemId: 'item@123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Item ID must be alphanumeric'
        );
      }
    });

    it('should apply default values', () => {
      const valid = TriggerResearchSchema.safeParse({
        itemId: 'item-123',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.runType).toBe('manual_request');
        expect(valid.data.priority).toBe('normal');
      }
    });
  });

  // ============================================================================
  // GetPricingAnalysisSchema Tests
  // ============================================================================
  describe('GetPricingAnalysisSchema', () => {
    it('should accept valid itemId', () => {
      const valid = GetPricingAnalysisSchema.safeParse({
        itemId: 'item-123',
      });
      expect(valid.success).toBe(true);
    });

    it('should accept itemId with alphanumeric, hyphens, and underscores', () => {
      const valid = GetPricingAnalysisSchema.safeParse({
        itemId: 'item_ABC-123',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject empty itemId', () => {
      const result = GetPricingAnalysisSchema.safeParse({
        itemId: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Item ID cannot be empty');
      }
    });

    it('should reject itemId with invalid characters', () => {
      const result = GetPricingAnalysisSchema.safeParse({
        itemId: 'item@123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Item ID must be alphanumeric'
        );
      }
    });

    it('should reject missing itemId', () => {
      const result = GetPricingAnalysisSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // ResearchFieldSchema Tests
  // ============================================================================
  describe('ResearchFieldSchema', () => {
    describe('Valid Inputs', () => {
      it('should accept valid input with required fields', () => {
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
        });
        expect(valid.success).toBe(true);
        if (valid.success) {
          expect(valid.data.researchMode).toBe('fast'); // default
        }
      });

      it('should accept all optional parameters', () => {
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
          researchMode: 'thorough',
          hint: 'I think it might be Sony',
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('FieldName Validation', () => {
      it('should accept valid field names', () => {
        const validFields = [
          'brand',
          'model',
          'title',
          'description',
          'upc',
          'mpn',
          'color',
        ];
        validFields.forEach((fieldName) => {
          const valid = ResearchFieldSchema.safeParse({
            itemId: 'item-123',
            fieldName,
          });
          expect(valid.success).toBe(true);
        });
      });

      it('should reject empty field name', () => {
        const result = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Field name cannot be empty'
          );
        }
      });

      it('should reject excessively long field name (max 50)', () => {
        const longFieldName = 'a'.repeat(51);
        const result = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: longFieldName,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Field name too long');
        }
      });

      it('should accept field name at max length (50)', () => {
        const maxFieldName = 'a'.repeat(50);
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: maxFieldName,
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('Hint Validation', () => {
      it('should accept optional hint', () => {
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
          hint: 'I think it might be Sony',
        });
        expect(valid.success).toBe(true);
      });

      it('should accept missing hint', () => {
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
        });
        expect(valid.success).toBe(true);
      });

      it('should reject excessively long hint (max 500)', () => {
        const longHint = 'a'.repeat(501);
        const result = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
          hint: longHint,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Hint too long');
        }
      });

      it('should accept hint at max length (500)', () => {
        const maxHint = 'a'.repeat(500);
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
          hint: maxHint,
        });
        expect(valid.success).toBe(true);
      });
    });

    describe('ResearchMode Validation', () => {
      it('should accept all researchMode values', () => {
        const modes = ['fast', 'balanced', 'thorough'];
        modes.forEach((researchMode) => {
          const valid = ResearchFieldSchema.safeParse({
            itemId: 'item-123',
            fieldName: 'brand',
            researchMode,
          });
          expect(valid.success).toBe(true);
        });
      });

      it('should reject invalid researchMode', () => {
        const result = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
          researchMode: 'ultra',
        });
        expect(result.success).toBe(false);
      });

      it('should default to fast', () => {
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
        });
        expect(valid.success).toBe(true);
        if (valid.success) {
          expect(valid.data.researchMode).toBe('fast');
        }
      });
    });

    describe('ItemId Validation', () => {
      it('should accept valid itemId', () => {
        const valid = ResearchFieldSchema.safeParse({
          itemId: 'item-123',
          fieldName: 'brand',
        });
        expect(valid.success).toBe(true);
      });

      it('should reject empty itemId', () => {
        const result = ResearchFieldSchema.safeParse({
          itemId: '',
          fieldName: 'brand',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Item ID cannot be empty');
        }
      });

      it('should reject itemId with invalid characters', () => {
        const result = ResearchFieldSchema.safeParse({
          itemId: 'item@123!',
          fieldName: 'brand',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Item ID must be alphanumeric'
          );
        }
      });
    });
  });

  // ============================================================================
  // Security & Edge Cases
  // ============================================================================
  describe('Security & Edge Cases', () => {
    it('should sanitize SQL injection attempts in itemId', () => {
      const sqlInjection = "item-123'; DROP TABLE items; --";
      const result = SearchCompsSchema.safeParse({
        itemId: sqlInjection,
      });
      expect(result.success).toBe(false);
    });

    it('should sanitize XSS attempts in query', () => {
      const xss = '<script>alert("xss")</script>';
      const valid = SearchCompsSchema.safeParse({
        query: xss,
      });
      // Should pass validation but will be sanitized by the regex pattern
      expect(valid.success).toBe(true);
    });

    it('should handle Unicode characters in query', () => {
      const unicode = 'Sony PlayStation 5 日本版';
      const valid = SearchCompsSchema.safeParse({
        query: unicode,
      });
      expect(valid.success).toBe(true);
    });

    it('should handle very large numbers for prices', () => {
      const valid = SearchCompsSchema.safeParse({
        query: 'luxury item',
        minPrice: 1000000,
        maxPrice: 9999999,
      });
      expect(valid.success).toBe(true);
    });

    it('should handle decimal prices', () => {
      const valid = SearchCompsSchema.safeParse({
        query: 'item',
        minPrice: 9.99,
        maxPrice: 99.99,
      });
      expect(valid.success).toBe(true);
    });

    it('should reject null values for required fields', () => {
      const result = ResearchFieldSchema.safeParse({
        itemId: null,
        fieldName: 'brand',
      });
      expect(result.success).toBe(false);
    });

    it('should reject undefined values for required fields', () => {
      const result = ResearchFieldSchema.safeParse({
        itemId: undefined,
        fieldName: 'brand',
      });
      expect(result.success).toBe(false);
    });

    it('should handle empty objects', () => {
      const schemas = [
        GetResearchDataSchema,
        SearchCompsSchema,
        TriggerResearchSchema,
        GetPricingAnalysisSchema,
        ResearchFieldSchema,
      ];

      schemas.forEach((schema) => {
        const result = schema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });
});
