import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Storefront = () => {
  const { slug } = useParams();
  const addToCart = useCartStore((state) => state.addItem);
  const { t } = useLanguage();

  const { data, isLoading, error } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => storeService.getStoreBySlug(slug!),
    enabled: !!slug
  });

  if (isLoading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse text-gray-500">{t.loadingStore}...</div>
    </div>
  );
  
  if (error || !data) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.storeNotFound}</h2>
      <p className="text-gray-500">{t.storeNotFoundMessage}</p>
    </div>
  );

  const { store, products } = data.data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Store Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
        <p className="text-gray-500 flex items-center mt-2">
          <span className="inline-block w-4 h-4 bg-gray-200 rounded-full mr-2"></span>
          {store.location}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product: any) => {
          const isOutOfStock = product.stock_quantity === 0;
          
          return (
             <div 
                key={product.id} 
                className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col ${
                  isOutOfStock ? 'grayscale opacity-75' : ''
                }`}
             >
                <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
                   {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                      />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">{t.noImage}</div>
                   )}
                   {isOutOfStock && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                       <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                         {t.outOfStock}
                       </span>
                     </div>
                   )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-lg truncate mb-1" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-blue-600 font-bold">Rp {product.price.toLocaleString()}</span>
                    </div>
                    
                    <p className={`text-xs font-medium mb-4 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                      {isOutOfStock ? t.outOfStockQty : `${t.remaining}: ${product.stock_quantity}`}
                    </p>

                    <button 
                        onClick={() => addToCart({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                            storeId: store.id,
                            image_url: product.image_url
                        })}
                        disabled={isOutOfStock}
                        className={`mt-auto w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                          isOutOfStock 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {isOutOfStock ? t.outOfStock : t.add}
                    </button>
                </div>
             </div>
          );
        })}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          {t.noProductsInStore}
        </div>
      )}
    </div>
  );
};

export default Storefront;