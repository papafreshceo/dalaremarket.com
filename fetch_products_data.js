// Supabase 데이터베이스에서 상품 정보를 조회하는 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchProductsData() {
  try {
    console.log('Supabase에 연결 중...\n');

    // 1. raw_materials 테이블 조회 (원재료/상품)
    console.log('=== Raw Materials 테이블 조회 ===');
    const { data: rawMaterials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('material_code, material_name, category_1, category_2, category_3, category_4, standard_unit, supply_status, season')
      .order('category_1', { ascending: true })
      .order('category_2', { ascending: true })
      .order('material_name', { ascending: true });

    if (materialsError) {
      console.error('Raw Materials 조회 에러:', materialsError);
      throw materialsError;
    }

    console.log(`총 ${rawMaterials.length}개의 원재료 조회 완료\n`);

    // 2. option_products 테이블 조회 (상품 옵션)
    console.log('=== Option Products 테이블 조회 ===');
    const { data: optionProducts, error: optionsError } = await supabase
      .from('option_products')
      .select('option_code, option_name, variety, specification_1, specification_2, weight, weight_unit, seller_supply_price, status, season')
      .order('variety', { ascending: true })
      .order('option_name', { ascending: true });

    if (optionsError) {
      console.error('Option Products 조회 에러:', optionsError);
      throw optionsError;
    }

    console.log(`총 ${optionProducts.length}개의 옵션 상품 조회 완료\n`);

    // 3. 카테고리별 분류 (category_1, category_2, category_3 기준)
    const category1List = [...new Set(rawMaterials.map(m => m.category_1))].filter(Boolean);
    const category2List = [...new Set(rawMaterials.map(m => m.category_2))].filter(Boolean);
    const category3List = [...new Set(rawMaterials.map(m => m.category_3))].filter(Boolean);

    // 상품 품종별 분류
    const varieties = [...new Set(optionProducts.map(p => p.variety))].filter(Boolean);

    console.log('=== 취급 품목 카테고리 ===');
    console.log('대분류 (category_1):', JSON.stringify(category1List, null, 2));
    console.log('중분류 (category_2):', JSON.stringify(category2List, null, 2));
    console.log('소분류 (category_3):', JSON.stringify(category3List, null, 2));
    console.log('상품 품종 (variety):', JSON.stringify(varieties, null, 2));
    console.log(`\n총 대분류 ${category1List.length}개, 중분류 ${category2List.length}개, 소분류 ${category3List.length}개`);
    console.log(`상품 품종 ${varieties.length}개\n`);

    // 4. 대표 상품 선택 (원재료 10개, 옵션 상품 10개)
    const representativeMaterials = rawMaterials.slice(0, 10).map(m => ({
      type: '원재료',
      code: m.material_code,
      name: m.material_name,
      category: `${m.category_1 || ''} > ${m.category_2 || ''} > ${m.category_3 || ''}`,
      unit: m.standard_unit,
      supply_status: m.supply_status,
      season: m.season
    }));

    const representativeOptions = optionProducts.slice(0, 10).map(p => ({
      type: '옵션상품',
      code: p.option_code,
      name: p.option_name,
      variety: p.variety,
      specification: `${p.specification_1 || ''} ${p.specification_2 || ''}`.trim(),
      weight: `${p.weight || ''} ${p.weight_unit || ''}`.trim(),
      price: p.seller_supply_price,
      status: p.status,
      season: p.season
    }));

    const representativeProducts = [...representativeMaterials, ...representativeOptions];

    console.log('=== 대표 상품 20개 ===');
    console.log(JSON.stringify(representativeProducts, null, 2));

    // 5. 결과를 JSON 파일로 저장
    const result = {
      summary: {
        total_raw_materials: rawMaterials.length,
        total_option_products: optionProducts.length,
        total_category_1: category1List.length,
        total_category_2: category2List.length,
        total_category_3: category3List.length,
        total_varieties: varieties.length,
        timestamp: new Date().toISOString()
      },
      categories: {
        category_1: category1List,
        category_2: category2List,
        category_3: category3List,
        varieties: varieties
      },
      representative_products: representativeProducts,
      all_raw_materials: rawMaterials.map(m => ({
        code: m.material_code,
        name: m.material_name,
        category_1: m.category_1,
        category_2: m.category_2,
        category_3: m.category_3,
        category_4: m.category_4,
        unit: m.standard_unit,
        supply_status: m.supply_status,
        season: m.season
      })),
      all_option_products: optionProducts.map(p => ({
        code: p.option_code,
        name: p.option_name,
        item_type: p.item_type,
        variety: p.variety,
        specification_1: p.specification_1,
        specification_2: p.specification_2,
        weight: p.weight,
        weight_unit: p.weight_unit,
        price: p.seller_supply_price,
        status: p.status,
        season: p.season
      }))
    };

    const fs = require('fs');
    const outputPath = 'products_data_result.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    console.log(`\n결과가 ${outputPath} 파일에 저장되었습니다.`);

    // 6. 콘솔에 요약 정보 출력
    console.log('\n=== 요약 ===');
    console.log(`- 총 원재료 수: ${rawMaterials.length}`);
    console.log(`- 총 옵션 상품 수: ${optionProducts.length}`);
    console.log(`- 대분류 카테고리: ${category1List.length}개`);
    console.log(`- 중분류 카테고리: ${category2List.length}개`);
    console.log(`- 소분류 카테고리: ${category3List.length}개`);
    console.log(`- 상품 타입: ${itemTypes.length}개`);

    console.log('\n대분류 카테고리:');
    category1List.forEach((cat, idx) => {
      const count = rawMaterials.filter(m => m.category_1 === cat).length;
      console.log(`  ${idx + 1}. ${cat} (${count}개 원재료)`);
    });

    console.log('\n상품 타입:');
    itemTypes.forEach((type, idx) => {
      const count = optionProducts.filter(p => p.item_type === type).length;
      console.log(`  ${idx + 1}. ${type} (${count}개 옵션)`);
    });

    return result;

  } catch (error) {
    console.error('데이터 조회 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
fetchProductsData()
  .then(() => {
    console.log('\n데이터 조회 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('실행 실패:', error);
    process.exit(1);
  });
