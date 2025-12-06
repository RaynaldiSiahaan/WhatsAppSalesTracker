import { useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const OrderSuccess = () => {
  const { code } = useParams();
  const { t } = useLanguage();

  return (
    <div className="max-w-md mx-auto mt-20 text-center p-6 bg-white rounded-xl shadow-lg">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.orderPlaced}</h1>
      <p className="text-gray-600 mb-6">{t.orderSentSuccessfully}</p>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{t.orderCode}</p>
        <p className="text-xl font-mono font-bold text-gray-800 mt-1">{code}</p>
      </div>
      <p className="mt-8 text-sm text-gray-500">{t.saveOrderCodeNotice}</p>
    </div>
  );
};

export default OrderSuccess;
