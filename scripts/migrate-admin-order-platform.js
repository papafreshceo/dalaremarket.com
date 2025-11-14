/**
 * Admin Order Platform seller_id → organization_id 마이그레이션 스크립트
 *
 * 이 스크립트는 src/app/admin/order-platform/page.tsx 파일의
 * seller_id 관련 코드를 organization_id로 자동 변환합니다.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/order-platform/page.tsx');

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔄 Admin Order Platform 마이그레이션 시작...\n');

// 1. Interface 이름 변경
console.log('1️⃣  Interface 변경: SellerStats → OrganizationStats');
content = content.replace(/interface SellerStats/g, 'interface OrganizationStats');

// 2. State 변수명 변경
console.log('2️⃣  State 변수명 변경');
const stateReplacements = [
  { from: /const \[sellerStats, setSellerStats\]/g, to: 'const [organizationStats, setOrganizationStats]' },
  { from: /const \[selectedSeller, setSelectedSeller\]/g, to: 'const [selectedOrganization, setSelectedOrganization]' },
  { from: /const \[sellerNames, setSellerNames\]/g, to: 'const [organizationNames, setOrganizationNames]' },
  { from: /const \[expandedSellers, setExpandedSellers\]/g, to: 'const [expandedOrganizations, setExpandedOrganizations]' },
  { from: /const \[sellerStatsExpanded, setSellerStatsExpanded\]/g, to: 'const [organizationStatsExpanded, setOrganizationStatsExpanded]' },
];

stateReplacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// 3. 탭 이름 변경
console.log('3️⃣  탭 이름 변경');
content = content.replace(/'셀러별정산내역'/g, "'조직별정산내역'");
content = content.replace(/'셀러랭킹'/g, "'조직랭킹'");

// 4. 함수명 변경
console.log('4️⃣  함수명 변경');
content = content.replace(/calculateSellerStats/g, 'calculateOrganizationStats');
content = content.replace(/const handlePaymentCheckToggle = async \(sellerId: string/g, 'const handlePaymentCheckToggle = async (organizationId: string');
content = content.replace(/const handleRefundComplete = async \(sellerId: string/g, 'const handleRefundComplete = async (organizationId: string');

// 5. 변수명 변경 (seller → organization)
console.log('5️⃣  변수명 일괄 변경');
const variableReplacements = [
  // seller_id 필드명
  { from: /seller_id:/g, to: 'organization_id:' },
  { from: /seller_name:/g, to: 'organization_name:' },

  // 로컬 변수
  { from: /const sellerId =/g, to: 'const organizationId =' },
  { from: /const sellerOrders =/g, to: 'const organizationOrders =' },
  { from: /const orderSellerId =/g, to: 'const orderOrgId =' },
  { from: /const sellerRefundOrders =/g, to: 'const organizationRefundOrders =' },
  { from: /const sellerIds =/g, to: 'const organizationIds =' },

  // Map 변수
  { from: /sellerNames\./g, to: 'organizationNames.' },
  { from: /sellerStats\./g, to: 'organizationStats.' },
  { from: /setSellerNames/g, to: 'setOrganizationNames' },
  { from: /setSellerStats/g, to: 'setOrganizationStats' },

  // 조건문
  { from: /selectedSeller &&/g, to: 'selectedOrganization &&' },
  { from: /selectedSeller\)/g, to: 'selectedOrganization)' },
  { from: /setSelectedSeller/g, to: 'setSelectedOrganization' },

  // UI 텍스트
  { from: /'해당 셀러의'/g, to: "'해당 조직의'" },
  { from: /'셀러'/g, to: "'조직'" },
];

variableReplacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// 6. API 호출 변경
console.log('6️⃣  API 호출 변경');
content = content.replace(/onlyWithSeller=true/g, 'onlyWithOrganization=true');

// 7. Supabase 쿼리 변경 (users → organizations)
console.log('7️⃣  Supabase 쿼리 변경');
content = content.replace(
  /from\('users'\)\s*\.select\('id, company_name, name'\)/g,
  "from('organizations').select('id, name')"
);
content = content.replace(/\.in\('id', sellerIds\)/g, ".in('id', organizationIds)");
content = content.replace(/users\.forEach\(\(user: any\) =>/g, "organizations.forEach((org: any) =>");
content = content.replace(/const displayName = user\.company_name \|\| user\.name \|\| user\.id;/g, "const displayName = org.name || org.id;");
content = content.replace(/nameMap\.set\(user\.id, displayName\);/g, "nameMap.set(org.id, displayName);");

// 8. Interface 속성명 변경 (statsMap 내부)
console.log('8️⃣  Interface 속성명 변경');
// 주의: order.seller_id는 유지 (DB 필드), SellerStats의 seller_id만 organization_id로 변경

// 9. expandedSellers → expandedOrganizations
console.log('9️⃣  Expanded state 변경');
content = content.replace(/expandedSellers\./g, 'expandedOrganizations.');
content = content.replace(/setExpandedSellers/g, 'setExpandedOrganizations');

// 백업 파일 생성
const backupPath = filePath + '.backup';
fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));
console.log(`\n📁 백업 파일 생성: ${backupPath}`);

// 변경된 내용 저장
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ 마이그레이션 완료!');
console.log('\n⚠️  주의사항:');
console.log('   - 백업 파일을 확인하세요');
console.log('   - order.seller_id (DB 필드)는 유지되었습니다');
console.log('   - 수동으로 확인이 필요한 부분이 있을 수 있습니다');
console.log('   - 특히 filter 및 map 함수의 로직을 검토하세요\n');
