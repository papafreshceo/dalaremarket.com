#!/usr/bin/env node

/**
 * DB Schema Analyzer
 *
 * 사용법:
 *   node scripts/analyze-db.js [테이블명]
 *
 * 예시:
 *   node scripts/analyze-db.js                    # 모든 테이블 목록
 *   node scripts/analyze-db.js option_products    # option_products 테이블 상세
 *   node scripts/analyze-db.js -s price           # 'price' 포함하는 컬럼 검색
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '../database/current_schema.json');

function loadSchema() {
  try {
    const data = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading schema:', error.message);
    process.exit(1);
  }
}

function listTables(schema) {
  console.log('\n📊 Database Tables\n');
  console.log('Generated at:', schema.generated_at);
  console.log('\n' + '='.repeat(80) + '\n');

  const tables = Object.keys(schema.tables).sort();

  tables.forEach(tableName => {
    const columns = schema.tables[tableName];
    const columnCount = columns.length;

    console.log(`📁 ${tableName.padEnd(40)} (${columnCount} columns)`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal: ${tables.length} tables\n`);
  console.log('💡 Tip: node scripts/analyze-db.js <table_name> to see details\n');
}

function showTableDetails(schema, tableName) {
  const columns = schema.tables[tableName];

  if (!columns) {
    console.error(`\n❌ Table '${tableName}' not found\n`);
    console.log('Available tables:');
    Object.keys(schema.tables).sort().forEach(t => console.log(`  - ${t}`));
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`📋 Table: ${tableName}`);
  console.log('='.repeat(80) + '\n');

  // 칼럼 이름 최대 길이 계산
  const maxColNameLen = Math.max(...columns.map(c => c.column_name.length));
  const maxDataTypeLen = Math.max(...columns.map(c => c.data_type.length));

  console.log('Column'.padEnd(maxColNameLen + 2) + 'Type'.padEnd(maxDataTypeLen + 2) + 'Sample Value');
  console.log('-'.repeat(80));

  columns.forEach(col => {
    const colName = col.column_name.padEnd(maxColNameLen + 2);
    const dataType = col.data_type.padEnd(maxDataTypeLen + 2);
    const sample = col.sample_value || '(null)';

    console.log(`${colName}${dataType}${sample}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${columns.length} columns\n`);
}

function searchColumns(schema, keyword) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 Searching for columns containing: "${keyword}"`);
  console.log('='.repeat(80) + '\n');

  let found = false;

  Object.entries(schema.tables).sort().forEach(([tableName, columns]) => {
    const matchingCols = columns.filter(col =>
      col.column_name.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matchingCols.length > 0) {
      found = true;
      console.log(`\n📁 ${tableName}:`);
      matchingCols.forEach(col => {
        console.log(`   • ${col.column_name.padEnd(40)} (${col.data_type})`);
      });
    }
  });

  if (!found) {
    console.log(`\n❌ No columns found containing "${keyword}"\n`);
  } else {
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

function main() {
  const args = process.argv.slice(2);
  const schema = loadSchema();

  if (args.length === 0) {
    // 테이블 목록 표시
    listTables(schema);
  } else if (args[0] === '-s' && args[1]) {
    // 컬럼 검색
    searchColumns(schema, args[1]);
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
DB Schema Analyzer

Usage:
  node scripts/analyze-db.js [options] [table_name]

Options:
  (none)              List all tables
  <table_name>        Show table details
  -s <keyword>        Search columns by keyword
  -h, --help          Show this help

Examples:
  node scripts/analyze-db.js
  node scripts/analyze-db.js option_products
  node scripts/analyze-db.js -s price
`);
  } else {
    // 테이블 상세 표시
    showTableDetails(schema, args[0]);
  }
}

main();
