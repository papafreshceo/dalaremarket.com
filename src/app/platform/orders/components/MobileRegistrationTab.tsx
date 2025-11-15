// src/app/platform/orders/components/MobileRegistrationTab.tsx
'use client';

import { useState } from 'react';
import ProductThumbnailGrid from './ProductThumbnailGrid';
import SingleOrderModal from '../modals/SingleOrderModal';

interface MobileRegistrationTabProps {
  isMobile: boolean;
  onRefresh?: () => void;
  userEmail: string;
  selectedSubAccount?: any | null;
}

interface SelectedProduct {
  id: number;
  option_name: string;
  option_code?: string;
  seller_supply_price?: number;
  category_4?: string;
}

export default function MobileRegistrationTab({
  isMobile,
  onRefresh,
  userEmail,
  selectedSubAccount
}: MobileRegistrationTabProps) {
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const handleSelectProduct = (product: SelectedProduct) => {
    setSelectedProduct(product);
    setShowOrderModal(true);
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <ProductThumbnailGrid onSelectProduct={handleSelectProduct} />

      <SingleOrderModal
        isOpen={showOrderModal}
        onClose={handleCloseModal}
        selectedProduct={selectedProduct}
        onRefresh={onRefresh}
        userEmail={userEmail}
        selectedSubAccount={selectedSubAccount}
      />
    </>
  );
}
