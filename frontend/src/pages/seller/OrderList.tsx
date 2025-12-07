import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const OrderList = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ['store-orders', storeId],
    queryFn: async () => {
      const res = await orderService.getStoreOrders(Number(storeId));
      return res.data;
    },
    enabled: !!storeId
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-orders', storeId] });
    }
  });

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    if (window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
        updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PREPARING': return 'bg-blue-100 text-blue-800';
      case 'READY_FOR_PICKUP': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="p-8">{t.loading}...</div>;

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t.orders}</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="px-6 py-3">{t.orderId}</th>
              <th className="px-6 py-3">{t.customer}</th>
              <th className="px-6 py-3">{t.total}</th>
              <th className="px-6 py-3">{t.status}</th>
              <th className="px-6 py-3">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-medium text-gray-900">
                  {order.order_code}
                  <div className="text-xs text-gray-500 mt-1">{new Date(order.pickup_time).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  Rp {Number(order.total_amount_gross).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <div className="flex gap-2">
                      {order.status === 'RECEIVED' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                          className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          title="Mark as Preparing"
                        >
                          <Loader className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'READY_FOR_PICKUP')}
                          className="p-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                          title="Mark as Ready"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === 'READY_FOR_PICKUP' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                          className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                        className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                        title="Cancel Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {t.noOrders}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
