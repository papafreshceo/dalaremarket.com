// Test script to fetch mapping settings data
const fetchMappingData = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/mapping-settings/fields');
    const result = await response.json();

    console.log('=== Mapping Settings Standard Fields ===');
    console.log('Success:', result.success);
    console.log('Total records:', result.data?.length || 0);

    if (result.data) {
      // Show first 3 records
      console.log('\n=== Sample Data (first 3 records) ===');
      result.data.slice(0, 3).forEach((row, index) => {
        console.log(`\n--- Record ${index + 1}: ${row.market_name} ---`);
        console.log('ID:', row.id);

        // Show first 15 field mappings
        for (let i = 1; i <= 15; i++) {
          const fieldKey = `field_${i}`;
          if (row[fieldKey]) {
            console.log(`  ${fieldKey}: ${row[fieldKey]}`);
          }
        }
      });

      // Show all market names
      console.log('\n=== All Market Names ===');
      result.data.forEach(row => {
        console.log(`- ${row.market_name}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

fetchMappingData();
