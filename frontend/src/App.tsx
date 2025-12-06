import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useLogger } from '@/hooks/useLogger';
import { LanguageProvider } from '@/contexts/LanguageContext';

function App() {
  useLogger();

  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
