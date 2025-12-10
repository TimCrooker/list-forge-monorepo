import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Organization Settings
 *
 * Adds 7 new settings columns to the organizations table:
 * 1. workflowSettings - AI provider, research config, service toggles
 * 2. notificationSettings - Email and webhook preferences
 * 3. teamSettings - Review assignment and permissions
 * 4. inventorySettings - Pricing defaults and item requirements
 * 5. marketplaceDefaultSettings - eBay/Amazon defaults
 * 6. billingSettings - Plan tier and limits
 * 7. securitySettings - MFA, session, API access
 *
 * All columns use JSONB with sensible defaults.
 */
export class AddOrganizationSettings1701000014000 implements MigrationInterface {
  name = 'AddOrganizationSettings1701000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Workflow Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "workflowSettings" jsonb
      DEFAULT '{"aiProvider":"openai","defaultModel":"gpt-4o","confidenceThreshold":0.75,"enableAutoResearch":true,"maxResearchRetries":3,"researchTimeoutMinutes":30,"enableOCR":true,"enableWebSearch":true,"maxConcurrentWorkflows":5}'
    `);

    // Notification Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "notificationSettings" jsonb
      DEFAULT '{"emailNotifications":{"enabled":true,"onItemReady":true,"onPublishSuccess":true,"onPublishFailure":true,"onLowConfidence":false},"webhooks":{"enabled":false,"url":null,"events":[],"secret":null}}'
    `);

    // Team Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "teamSettings" jsonb
      DEFAULT '{"autoAssignReviewer":false,"reviewerRotation":"manual","requireDualReview":false,"allowMembersToPublish":true,"requireAdminApproval":false,"allowBulkOperations":true}'
    `);

    // Inventory Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "inventorySettings" jsonb
      DEFAULT '{"defaultPricingStrategy":"competitive","defaultMarginPercent":30,"minimumMarginPercent":10,"enableAutoRelist":false,"autoRelistDelayDays":7,"lowStockThreshold":5,"requireConditionNotes":true,"mandatoryFields":["title","condition","price"]}'
    `);

    // Marketplace Default Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "marketplaceDefaultSettings" jsonb
      DEFAULT '{"ebay":{"listingDurationDays":30,"defaultShippingService":"USPS_PRIORITY","defaultReturnPolicy":"30_DAYS_MONEY_BACK","enableBestOffer":false},"amazon":{"fulfillmentChannel":"FBM","defaultCondition":"Used - Good"}}'
    `);

    // Billing Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "billingSettings" jsonb
      DEFAULT '{"plan":"free","billingEmail":null,"limits":{"maxItems":100,"maxMarketplaceAccounts":1,"maxTeamMembers":1,"maxMonthlyResearch":50}}'
    `);

    // Security Settings
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "securitySettings" jsonb
      DEFAULT '{"mfaRequired":false,"sessionTimeoutMinutes":480,"allowedIPRanges":[],"apiAccessEnabled":false,"apiRateLimit":100}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "securitySettings"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "billingSettings"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "marketplaceDefaultSettings"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "inventorySettings"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "teamSettings"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "notificationSettings"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "workflowSettings"
    `);
  }
}
