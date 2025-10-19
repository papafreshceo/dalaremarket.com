const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qxhpgjftkkcxdttgjkzj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs'
);

async function checkData() {
  console.log('=== Checking category_settings for "반시" ===');
  const { data: categories, error: catError } = await supabase
    .from('category_settings')
    .select('id, category_4, category_4_code, raw_material_status, seller_supply, is_active')
    .ilike('category_4', '%반시%')
    .eq('is_active', true);

  if (catError) {
    console.error('Error:', catError);
  } else {
    console.log('Found categories:', categories);
  }

  console.log('\n=== Checking option_products with "반시1kg (꼬마)" ===');
  const { data: options, error: optError } = await supabase
    .from('option_products')
    .select('id, option_code, option_name, category_4, seller_supply')
    .ilike('option_name', '%반시1kg%꼬마%');

  if (optError) {
    console.error('Error:', optError);
  } else {
    console.log('Found option products:', options);
  }

  console.log('\n=== Checking all categories with seller_supply data ===');
  const { data: allCats, error: allError } = await supabase
    .from('category_settings')
    .select('category_4, raw_material_status, seller_supply')
    .eq('is_active', true)
    .not('category_4', 'is', null)
    .order('category_4')
    .limit(20);

  if (allError) {
    console.error('Error:', allError);
  } else {
    console.log('Sample categories:');
    allCats.forEach(cat => {
      console.log(`  ${cat.category_4}: status=${cat.raw_material_status || 'null'}, seller_supply=${cat.seller_supply}`);
    });
  }
}

checkData();
