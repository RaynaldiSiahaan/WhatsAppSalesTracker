import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { productService } from '@/services/productService';
import { Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AddProduct = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
        let imageUrl = '';

        if (selectedFile) {
            const uploadRes = await productService.uploadImage(selectedFile);
            if (uploadRes.success) {
                imageUrl = uploadRes.data.url;
            }
        }

        const payload = {
            ...data,
            store_id: Number(storeId),
            stock_quantity: Number(data.stock_quantity),
            price: Number(data.price),
            image_url: imageUrl
        };

        await productService.addProduct(Number(storeId), payload);
        alert(t.productAdded);
        navigate(`/manage/${storeId}`);
    } catch (e) {
        console.error(e);
        alert(t.failedToAddProduct);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">{t.addNewProduct}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700">{t.productName}</label>
            <input 
              {...register('name', { required: true })} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500" 
            />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700">{t.price} (Rp)</label>
                <input 
                  type="number" 
                  {...register('price', { required: true, min: 0 })} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">{t.initialStock}</label>
                <input 
                  type="number" 
                  {...register('stock_quantity', { required: true, min: 0 })} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500" 
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.productImage}</label>
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">{t.clickToUpload}</span> {t.orDragAndDrop}</p>
                        <p className="text-xs text-gray-500">{t.imageFormatNotice}</p>
                        {selectedFile && (
                            <p className="mt-2 text-sm font-semibold text-blue-600">{t.selected}: {selectedFile.name}</p>
                        )}
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                            }
                        }}
                    />
                </label>
            </div>
        </div>

        <div className="flex gap-4">
            <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
                {t.cancel}
            </button>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
                {isSubmitting ? t.saving : t.saveProduct}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
