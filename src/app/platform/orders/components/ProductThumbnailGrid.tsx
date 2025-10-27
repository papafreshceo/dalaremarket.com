// src/app/platform/orders/components/ProductThumbnailGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package } from 'lucide-react';

interface OptionProduct {
  id: number;
  option_name: string;
  option_code?: string;
  seller_supply_price?: number;
  product_master_id?: number;
  thumbnail_url?: string;
  category_3?: string;
  category_4?: string;
}

interface ProductThumbnailGridProps {
  onSelectProduct: (product: OptionProduct) => void;
}

export default function ProductThumbnailGrid({ onSelectProduct }: ProductThumbnailGridProps) {
  const [products, setProducts] = useState<OptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // 1. products_master 조회 (품목 정보 - 출하중 상태만, 카테고리3 > 카테고리4 순)
      const { data: productsMaster, error: masterError } = await supabase
        .from('products_master')
        .select('id, category_3, category_4, supply_status')
        .eq('is_active', true)
        .eq('seller_supply', true)
        .eq('supply_status', '출하중')
        .not('category_4', 'is', null)
        .order('category_3', { ascending: true })
        .order('category_4', { ascending: true });

      if (masterError) {
        console.error('품목 마스터 조회 오류:', masterError);
        return;
      }

      // 2. 품목별 대표이미지 조회 (category_4_id 기준)
      const { data: representativeImages, error: imgError } = await supabase
        .from('cloudinary_images')
        .select('category_4_id, secure_url, is_representative')
        .eq('is_representative', true)
        .not('category_4_id', 'is', null);

      if (imgError) {
        console.error('대표이미지 조회 오류:', imgError);
      }

      // 3. 품목 ID -> 이미지 맵핑
      const categoryImageMap = new Map(
        (representativeImages || []).map(img => [img.category_4_id, img.secure_url])
      );

      // 4. 품목별 데이터 생성 (품목명을 option_name으로 사용)
      const categoryProducts = (productsMaster || []).map(pm => ({
        id: pm.id,
        option_name: pm.category_4, // 품목명을 상품명으로 사용
        option_code: undefined,
        seller_supply_price: undefined,
        product_master_id: pm.id,
        category_3: pm.category_3,
        category_4: pm.category_4,
        thumbnail_url: categoryImageMap.get(pm.id)
      }));

      setProducts(categoryProducts);
    } catch (error) {
      console.error('상품 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링 (품목명으로만 검색)
  const filteredProducts = products.filter(p =>
    p.category_4?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'var(--color-text-secondary)'
      }}>
        상품 로딩 중...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 검색창 */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="품목명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '12px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)'
          }}
        />
      </div>

      {/* 상품 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            onClick={() => onSelectProduct(product)}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: 'var(--color-surface)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          >
            {/* 썸네일 */}
            <div style={{
              width: '100%',
              height: '200px',
              background: product.thumbnail_url
                ? `url(${product.thumbnail_url}) center/cover`
                : 'var(--color-background-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!product.thumbnail_url && (
                <Package size={48} color="var(--color-text-tertiary)" />
              )}
            </div>

            {/* 품목 정보 */}
            <div style={{ padding: '16px' }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--color-text)',
                lineHeight: '1.4',
                textAlign: 'center'
              }}>
                {product.category_3 && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {product.category_3} / {' '}
                  </span>
                )}
                {product.category_4}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--color-text-secondary)'
        }}>
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
