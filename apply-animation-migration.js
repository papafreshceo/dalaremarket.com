const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔧 Adding animation_style column to supply_status_settings...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Add animation_style column
      ALTER TABLE supply_status_settings
      ADD COLUMN IF NOT EXISTS animation_style TEXT DEFAULT 'minimal_dot';

      -- Update existing records
      UPDATE supply_status_settings
      SET animation_style = 'minimal_dot'
      WHERE animation_style IS NULL;

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_supply_status_animation_style
      ON supply_status_settings(animation_style);

      SELECT 'Migration completed successfully' as result;
    `
  });

  if (error) {
    console.error('❌ Migration failed:', error);
  } else {
    console.log('✅ Migration completed successfully!');
    console.log(data);
  }
}

applyMigration().then(() => process.exit(0));
