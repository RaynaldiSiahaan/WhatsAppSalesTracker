import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';
import { getImageUrl } from '@/lib/api';
import { ArrowLeft, Edit } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ProductDetail = () => {
  const { storeId, productId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // 1. Get Store Info to get the Slug
  const { data: stores } = useQuery({
    queryKey: ['my-stores'],
    queryFn: async () => {
      const res = await storeService.getMyStores();
      return res.data;
    }
  });

  const currentStore = stores?.find((s) => s.id === Number(storeId));

  // 2. Get Catalog to find the product
  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      if (!currentStore) return null;
      return storeService.getStoreBySlug(currentStore.slug);
    },
    enabled: !!currentStore
  });

  if (!currentStore) return <div className="p-8">{t.loading} {t.store}...</div>;
  if (isLoading) return <div className="p-8">{t.loading} {t.product}...</div>;

  const product = catalogData?.data?.products.find((p: any) => p.id === Number(productId));

  if (!product) return <div className="p-8">{t.productNotFound}</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t.productDetailTitle}</h1>
      </div>
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
             {product.image_url ? (
                <img 
                    src={getImageUrl(product.image_url)} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                />
             ) : (
                <div className="flex items-center justify-center h-full text-gray-400">{t.noImage}</div>
             )}
        </div>

        {/* Info */}
        <div className="space-y-6">
            <div>
                <label className="text-sm text-gray-500 block mb-1">{t.productName}</label>
                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            </div>

            <div>
                <label className="text-sm text-gray-500 block mb-1">{t.price}</label>
                <p className="text-xl font-semibold text-blue-600">Rp {product.price.toLocaleString()}</p>
            </div>

            <div>
                <label className="text-sm text-gray-500 block mb-1">{t.currentStock}</label>
                <p className="text-lg font-medium text-gray-900">{product.stock_quantity} {t.unit}</p>
            </div>

            <div className="pt-6 border-t">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium opacity-50 cursor-not-allowed" disabled>
                    <Edit className="w-4 h-4" />
                    {t.editProduct} (Coming Soon)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;