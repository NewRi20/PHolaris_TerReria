import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '@/pages/landing/LandingPage'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import OnboardingLayout from '@/pages/onboarding/OnboardingLayout'
import Step1 from '@/pages/onboarding/Step1'
import Step2 from '@/pages/onboarding/Step2'
import Step3 from '@/pages/onboarding/Step3'
import Step4 from '@/pages/onboarding/Step4'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      { path: '1', element: <Step1 /> },
      { path: '2', element: <Step2 /> },
      { path: '3', element: <Step3 /> },
      { path: '4', element: <Step4 /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}