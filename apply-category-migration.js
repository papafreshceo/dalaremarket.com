const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://qxhpgjftkkcxdttgjkzj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.ROnP5ZRQC24Fg-aaPFIdVEr7EY7HW_9PHnELDNsZ3nM'
);

async function applyMigration() {
  const sql = fs.readFileSync('./supabase/migrations/20251019000004_add_status_to_category_settings.sql', 'utf8');

  console.log('Applying migration: add_status_to_category_settings');
  console.log('SQL:', sql);

  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('Error applying migration:', error);
  } else {
    console.log('Migration applied successfully!');
  }
}

applyMigration();
