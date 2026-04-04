import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import your team's new Context Providers
import { AuthProvider } from './setup/auth/authContext';
import { OnboardingProvider } from './setup/app-context-manager/OnBoardingContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <OnboardingProvider>
      <App />
    </OnboardingProvider>
  </AuthProvider>
);