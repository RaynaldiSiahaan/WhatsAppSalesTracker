import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';
import { dashboardService } from '@/services/dashboardService';
import { Link } from 'react-router-dom';
import { Plus, Store as StoreIcon, TrendingUp, ShoppingBag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  // Fetch Stores
  const { data: stores, isLoading: isLoadingStores } = useQuery({
    queryKey: ['my-stores'],
    queryFn: async () => {
      const res = await storeService.getMyStores();
      return res.data;
    }
  });

  // Fetch Dashboard Stats
  const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats()
  });

  const stats = statsResponse?.data;

  // Create Store Mutation
  const { register, handleSubmit, reset } = useForm();
  const createMutation = useMutation({
    mutationFn: storeService.createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stores'] });
      reset();
      alert(t.storeCreated);
    },
    onError: (error: any) => {
        // Handle error specifically for store creation (e.g., limit reached)
        alert(error.message || 'Failed to create store');
    }
  });

  const onCreateStore = (data: any) => {
    createMutation.mutate(data);
  };

  if (isLoadingStores || isLoadingStats) return <div className="p-8">{t.loading} {t.dashboardTitle}...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.dashboardTitle}</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t.totalSales}</p>
              <p className="text-2xl font-bold text-gray-900">Rp {stats?.total_sales_gross.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t.totalOrders}</p>
              <p className="text-2xl font-bold text-gray-900">
                  {stats?.orders_count.total || 0} <span className="text-sm font-normal text-gray-500">({stats?.orders_count.pending || 0} Pending)</span>
              </p>
            </div>
          </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <StoreIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t.storeCount}</p>
              <p className="text-2xl font-bold text-gray-900">{stores?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t.myStores}</h2>

      {/* Create Store Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-base font-semibold mb-4 text-gray-800">{t.createStoreTitle}</h3>
        <form onSubmit={handleSubmit(onCreateStore)} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.storeNameLabel}</label>
            <input
              {...register('name', { required: true })}
              className="block w-full rounded-lg border-gray-300 shadow-sm border p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Warung Budi"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.locationLabel}</label>
            <input
               {...register('location', { required: true })}
              className="block w-full rounded-lg border-gray-300 shadow-sm border p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Jakarta Selatan"
            />
          </div>
          <button 
            type="submit" 
            disabled={createMutation.isPending}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {t.createStoreButton}
          </button>
        </form>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores?.map((store) => (
          <div key={store.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
                   <p className="text-sm text-gray-500">{store.location}</p>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">
                  {store.store_code}
                </span>
              </div>
              
              <div className="border-t pt-4 flex flex-col gap-3">
                <Link 
                  to={`/manage/${store.id}`} 
                  className="w-full text-center bg-blue-50 text-blue-600 py-2 rounded-lg font-medium text-sm hover:bg-blue-100"
                >
                  {t.manageStore}
                </Link>
                 <a 
                  href={`/s/${store.slug}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
                >
                  {t.viewPublicCatalog}
                </a>
              </div>
            </div>
          </div>
        ))}
        
        {stores?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">{t.noStores}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;