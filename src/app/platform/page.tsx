import ProductsContent from './products/ProductsContent';

export default function PlatformPage() {
  // 플랫폼 페이지는 로그인 없이도 볼 수 있음
  // 로그인이 필요한 기능은 각 컴포넌트에서 개별 처리
  return <ProductsContent />;
}
