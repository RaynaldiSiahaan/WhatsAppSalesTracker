import { Link } from 'react-router-dom';
import { Store, Share2, ShoppingBag } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="text-center font-sans text-gray-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Kelola Toko Online <br className="hidden md:block" />
            <span className="text-blue-600">Semudah Chatting</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Platform jualan simpel untuk UMKM. Buat toko dalam hitungan detik, upload produk, dan bagikan link katalog langsung ke pelanggan Anda lewat WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Buat Toko Sekarang
            </Link>
            <Link
              to="/login"
              className="bg-white text-blue-600 border border-blue-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition shadow-sm"
            >
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-16 text-gray-800">Cara Kerja Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Buka Toko</h3>
              <p className="text-gray-600 leading-relaxed">
                Daftar gratis dan atur profil toko Anda. Tambahkan produk, harga, dan stok dengan mudah.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Share2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Share Link</h3>
              <p className="text-gray-600 leading-relaxed">
                Dapatkan link unik toko Anda (contoh: www.yangpentingbisa.web.id/s/kopi-enak). Bagikan ke WhatsApp atau Sosmed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Terima Order</h3>
              <p className="text-gray-600 leading-relaxed">
                Pelanggan pesan tanpa install aplikasi. Order masuk ke dashboard Anda secara real-time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;