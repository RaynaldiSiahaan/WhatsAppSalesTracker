import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';
import { productService } from '@/services/productService';
import { Plus, Share2, Copy, ExternalLink, Minus, Plus as PlusIcon, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const StoreManager = () => {
  const { storeId } = useParams();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  // Fetch Store Info (reuse getMyStores and filter, or separate endpoint. 
  // For now we assume we can get it from the cache or fetch list)
  const { data: stores } = useQuery({
    queryKey: ['my-stores'],
    queryFn: async () => {
      const res = await storeService.getMyStores();
      return res.data;
    }
  });
  
  const currentStore = stores?.find((s) => s.id === Number(storeId));

  // Fetch Products for this store
  // NOTE: We need a specific endpoint for seller to get products. 
  // Reusing public endpoint for now as it's closest available in contract
  const { data: catalogData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      if (!currentStore) return null;
      return storeService.getStoreBySlug(currentStore.slug);
    },
    enabled: !!currentStore
  });

  // Stock Update Mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ productId, qty }: { productId: number; qty: number }) =>
      productService.updateStock(productId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-products', storeId] });
    }
  });

  const handleCopyLink = () => {
    if (!currentStore) return;
    const url = `${window.location.origin}/s/${currentStore.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link katalog berhasil disalin!'); // Need translation key
  };

  const handleShareWA = () => {
    if (!currentStore) return;
    const url = `${window.location.origin}/s/${currentStore.slug}`;
    const text = `Halo! Cek katalog online ${currentStore.name} di sini: ${url}`; // Need translation key
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleUpdateStock = (productId: number, currentStock: number, delta: number) => {
    const newStock = currentStock + delta;
    if (newStock < 0) return;
    updateStockMutation.mutate({ productId, qty: newStock });
  };

  if (!currentStore) return <div className="p-6">{t.loading} {t.storeInfo}...</div>;

  return (
    <div>
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentStore.name}</h1>
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Code: {currentStore.store_code}</span>
            <span>•</span>
            <span>{currentStore.location}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            {t.copyLink}
          </button>
           <button 
            onClick={handleShareWA}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-200"
          >
            <Share2 className="w-4 h-4" />
            {t.shareWA}
          </button>
          <Link 
            to={`/manage/${storeId}/add-product`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t.addProduct}
          </Link>
        </div>
      </div>
      
      {/* Public Link Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-blue-800">
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">{t.publicCatalogActive}:</span>
          <a href={`/s/${currentStore.slug}`} target="_blank" className="font-bold underline">
            /s/{currentStore.slug}
          </a>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
            <h2 className="text-lg font-bold">{t.productList}</h2>
        </div>
        
        {isLoadingProducts ? (
            <div className="p-6 text-center">{t.loadingProducts}...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                            <th className="px-6 py-3">{t.productName}</th>
                            <th className="px-6 py-3">{t.price}</th>
                            <th className="px-6 py-3">{t.stock} (Quick Edit)</th>
                            <th className="px-6 py-3 text-right">{t.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {catalogData?.data?.products.map((product: any) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="font-medium text-gray-900">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    Rp {product.price.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleUpdateStock(product.id, product.stock_quantity, -1)}
                                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                                            disabled={product.stock_quantity <= 0}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-mono font-medium">{product.stock_quantity}</span>
                                        <button 
                                            onClick={() => handleUpdateStock(product.id, product.stock_quantity, 1)}
                                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link 
                                            to={`/manage/${storeId}/product/${product.id}`}
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            <Eye className="w-4 h-4" />
                                            {t.view}
                                        </Link>
                                        <button className="text-red-600 hover:text-red-800 font-medium">{t.delete}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {catalogData?.data?.products.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    {t.noProductsYet}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default StoreManager;