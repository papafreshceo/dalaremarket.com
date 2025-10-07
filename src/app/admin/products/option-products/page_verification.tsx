// 변경사항 검증 로직
export const verifyPriceCalculations = async (beforeSave: Map<string, any>, products: any[], supabase: any, setVerificationResults: any) => {
  const savedProducts = Array.from(beforeSave.keys()).map(id => products.find(p => p.id === id)).filter(Boolean)

  const allChanges: Array<{
    optionCode: string
    optionName: string
    changes: string[]
  }> = []

  for (const p of savedProducts) {
    const before = beforeSave.get(p!.id)

    const { data: dbProduct } = await supabase
      .from('option_products')
      .select('*')
      .eq('id', p!.id)
      .single()

    if (dbProduct && before) {
      const changes: string[] = []

      // 모든 필드 비교
      const fields = [
        { key: 'option_code', label: '옵션코드', format: (v: any) => v },
        { key: 'option_name', label: '옵션명', format: (v: any) => v },
        { key: 'total_cost', label: '총원가', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'shipping_fee', label: '택배비', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'material_cost_policy', label: '원물가정책', format: (v: any) => v === 'auto' ? '자동' : '고정' },
        { key: 'seller_supply_price_mode', label: '셀러모드', format: (v: any) => v },
        { key: 'naver_price_mode', label: '네이버모드', format: (v: any) => v },
        { key: 'coupang_price_mode', label: '쿠팡모드', format: (v: any) => v },
        { key: 'margin_calculation_type', label: '마진계산방식', format: (v: any) => v === 'rate' ? '마진율' : '마진액' },
        { key: 'target_seller_margin_rate', label: '목표셀러마진%', format: (v: any) => (v || 0) + '%', threshold: 0.1 },
        { key: 'target_margin_rate', label: '목표직판마진%', format: (v: any) => (v || 0) + '%', threshold: 0.1 },
        { key: 'target_margin_amount', label: '목표직판마진액', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'seller_supply_price', label: '셀러공급가', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'naver_paid_shipping_price', label: '네이버유료', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'naver_free_shipping_price', label: '네이버무료', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'coupang_paid_shipping_price', label: '쿠팡유료', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
        { key: 'coupang_free_shipping_price', label: '쿠팡무료', format: (v: any) => (v || 0).toLocaleString() + '원', threshold: 1 },
      ]

      for (const field of fields) {
        const beforeVal = before[field.key]
        const afterVal = dbProduct[field.key]

        let hasChanged = false
        if (field.threshold !== undefined) {
          hasChanged = Math.abs((beforeVal || 0) - (afterVal || 0)) >= field.threshold
        } else {
          hasChanged = beforeVal !== afterVal
        }

        if (hasChanged) {
          changes.push(`${field.label}: ${field.format(beforeVal)} → ${field.format(afterVal)}`)
        }
      }

      if (changes.length > 0) {
        allChanges.push({
          optionCode: dbProduct.option_code || '',
          optionName: dbProduct.option_name || '',
          changes
        })
      }
    }
  }

  setVerificationResults({
    allChanges,
    hasChanges: allChanges.length > 0
  })
}
