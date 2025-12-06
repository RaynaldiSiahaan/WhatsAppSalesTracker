import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';

const Login = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const { t } = useLanguage();

  const onSubmit = async (data: any) => {
    try {
      const res = await authService.login(data);
      if (res.success) {
        const userWithActiveStatus = { ...res.data.user, is_active: true };
        loginStore(userWithActiveStatus, res.data.accessToken, res.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed', error);
      if (error.response && error.response.status === 400) {
        const msg = error.response.data?.message || t.validationError;
        alert(msg);
      } else {
        alert(t.loginFailed);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">{t.loginTitle}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t.emailLabel}</label>
          <input
            type="email"
            {...register('email', { required: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t.passwordLabel}</label>
          <input
            type="password"
            {...register('password', { required: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {t.signInButton}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {t.noAccount}{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
          {t.registerLink}
        </Link>
      </p>
    </div>
  );
};

export default Login;
