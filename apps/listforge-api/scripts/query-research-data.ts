import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function queryResearchData() {
  // Build database connection options
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'listforge',
    password: process.env.DB_PASSWORD || 'listforge',
    database: process.env.DB_NAME || 'listforge_dev',
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully!\n');

    // Query 1: Recent research runs overview
    console.log('========================================');
    console.log('QUERY 1: Recent Research Runs Overview');
    console.log('========================================\n');

    const runs = await dataSource.query(`
      SELECT
        irr.id as run_id,
        irr."runType",
        irr.status,
        TO_CHAR(irr."startedAt", 'YYYY-MM-DD HH24:MI:SS') as started_at,
        TO_CHAR(irr."completedAt", 'YYYY-MM-DD HH24:MI:SS') as completed_at,
        i.title,
        ir.data->'productIdentification'->>'productName' as product_name,
        ir.data->'productIdentification'->>'confidence' as identification_confidence,
        jsonb_array_length(COALESCE(ir.data->'comparables', '[]'::jsonb)) as comp_count,
        ir.data->'pricing'->>'estimatedPrice' as estimated_price,
        ir.data->'pricing'->>'confidence' as pricing_confidence,
        jsonb_array_length(COALESCE(ir.data->'missingInfo', '[]'::jsonb)) as missing_info_count,
        irr.field_states IS NOT NULL as has_field_states,
        irr.research_cost_usd as cost_usd,
        irr.research_mode as mode,
        irr.step_count as step_count
      FROM item_research_runs irr
      JOIN items i ON i.id = irr."itemId"
      LEFT JOIN item_research ir ON ir."researchRunId" = irr.id AND ir."isCurrent" = true
      ORDER BY irr."startedAt" DESC
      LIMIT 10
    `);

    console.table(runs);

    // Query 2: Comp validation scores from latest run
    if (runs.length > 0) {
      const latestRunId = runs[0].run_id;

      console.log('\n========================================');
      console.log('QUERY 2: Comp Validation Scores (Latest Run)');
      console.log('========================================\n');

      const compScores = await dataSource.query(`
        SELECT
          comp->>'title' as title,
          (comp->>'price')::float as price,
          comp->>'dataSource' as data_source,
          (comp->>'validationScore')::float as validation_score,
          (comp->>'confidence')::float as confidence,
          comp->>'reasoning' as reasoning
        FROM item_research ir,
             jsonb_array_elements(ir.data->'comparables') comp
        WHERE ir."researchRunId" = $1
        AND ir."isCurrent" = true
        ORDER BY (comp->>'validationScore')::float DESC NULLS LAST
        LIMIT 20
      `, [latestRunId]);

      if (compScores.length > 0) {
        console.table(compScores);

        // Calculate statistics
        const avgValidation = compScores.reduce((sum, c) => sum + (c.validation_score || 0), 0) / compScores.length;
        const lowQualityCount = compScores.filter(c => (c.validation_score || 0) < 0.60).length;

        console.log(`\nStats for Run ${latestRunId}:`);
        console.log(`- Total Comps: ${compScores.length}`);
        console.log(`- Avg Validation Score: ${avgValidation.toFixed(3)}`);
        console.log(`- Low Quality (< 0.60): ${lowQualityCount} (${((lowQualityCount / compScores.length) * 100).toFixed(1)}%)`);
      } else {
        console.log('No comparables found for latest run');
      }

      // Query 3: Activity logs for latest run
      console.log('\n========================================');
      console.log('QUERY 3: Activity Logs (Latest Run)');
      console.log('========================================\n');

      const activities = await dataSource.query(`
        SELECT
          operation_type,
          title,
          message,
          status,
          step_id,
          TO_CHAR(created_at, 'HH24:MI:SS') as time,
          data
        FROM research_activity_logs
        WHERE research_run_id = $1
        ORDER BY created_at ASC
        LIMIT 50
      `, [latestRunId]);

      if (activities.length > 0) {
        console.table(activities.map(a => ({
          time: a.time,
          operation: a.operation_type,
          title: a.title,
          status: a.status,
          message: a.message?.substring(0, 60),
        })));

        console.log(`\nTotal operations: ${activities.length}`);
        const failed = activities.filter(a => a.status === 'failed').length;
        const completed = activities.filter(a => a.status === 'completed').length;
        console.log(`- Completed: ${completed}`);
        console.log(`- Failed: ${failed}`);
      } else {
        console.log('No activity logs found');
      }

      // Query 4: Field states from latest run
      console.log('\n========================================');
      console.log('QUERY 4: Field States (Latest Run)');
      console.log('========================================\n');

      const fieldStates = await dataSource.query(`
        SELECT field_states
        FROM item_research_runs
        WHERE id = $1
      `, [latestRunId]);

      if (fieldStates[0]?.field_states) {
        const fields = fieldStates[0].field_states.fields;
        const fieldSummary = Object.entries(fields).map(([name, field]: [string, any]) => ({
          field: name,
          value: field.value?.toString().substring(0, 30) || 'null',
          confidence: field.confidence?.value?.toFixed(3),
          status: field.status,
          required: field.required,
          attempts: field.attempts,
        }));

        console.table(fieldSummary);

        const requiredFields = fieldSummary.filter(f => f.required);
        const completed = requiredFields.filter(f => f.status === 'complete').length;
        console.log(`\nRequired Fields: ${completed}/${requiredFields.length} complete`);
      } else {
        console.log('No field states found');
      }
    }

    // Query 5: Overall research quality stats
    console.log('\n========================================');
    console.log('QUERY 5: Overall Research Quality Stats (Last 7 Days)');
    console.log('========================================\n');

    const stats = await dataSource.query(`
      WITH comp_stats AS (
        SELECT
          ir.id,
          jsonb_array_length(COALESCE(ir.data->'comparables', '[]'::jsonb)) as total_comps,
          (
            SELECT AVG((comp->>'validationScore')::float)
            FROM jsonb_array_elements(ir.data->'comparables') comp
            WHERE (comp->>'validationScore')::float IS NOT NULL
          ) as avg_validation_score,
          (
            SELECT COUNT(*)
            FROM jsonb_array_elements(ir.data->'comparables') comp
            WHERE (comp->>'validationScore')::float < 0.60
          ) as low_quality_comps
        FROM item_research ir
        WHERE ir.data->'comparables' IS NOT NULL
        AND ir.created_at > NOW() - INTERVAL '7 days'
        AND ir."isCurrent" = true
      )
      SELECT
        COUNT(*) as total_runs,
        AVG(total_comps)::numeric(10,1) as avg_comps_per_run,
        AVG(avg_validation_score)::numeric(10,3) as avg_validation_score,
        AVG(low_quality_comps)::numeric(10,1) as avg_low_quality_per_run,
        CASE
          WHEN SUM(total_comps) > 0 THEN
            (SUM(low_quality_comps) / SUM(total_comps) * 100)::numeric(10,1)
          ELSE 0
        END as pct_low_quality
      FROM comp_stats
    `);

    console.table(stats);

  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\nDatabase connection closed');
    }
  }
}

queryResearchData();
