import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '@/pages/landing/LandingPage'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import OnboardingLayout from '@/pages/onboarding/OnboardingLayout'
import Step1 from '@/pages/onboarding/Step1'
import Step2 from '@/pages/onboarding/Step2'
import Step3 from '@/pages/onboarding/Step3'
import Step4 from '@/pages/onboarding/Step4'
import AdminDashboard from '@/components/AdminDashboard'
import UnderservedAreas from '@/components/UnderservedAreas'
import EventsManagement from '@/components/EventsManagement'
import TeacherDirectory from '@/components/TeacherDirectory'
import TeacherDashboard from '@/components/TeacherDashboard'
import AdminPortalLayout from '@/pages/admin/AdminPortalLayout'
import TeacherPortalLayout from '@/pages/teacher/TeacherPortalLayout'
import { AppHomeRedirect, ProtectedRoute, PublicOnlyRoute, RoleProtectedRoute } from './guards'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/onboarding',
        element: <OnboardingLayout />,
        children: [
          { index: true, element: <Navigate to="1" replace /> },
          { path: '1', element: <Step1 /> },
          { path: '2', element: <Step2 /> },
          { path: '3', element: <Step3 /> },
          { path: '4', element: <Step4 /> },
        ],
      },
      {
        path: '/app',
        element: <AppHomeRedirect />,
      },
      {
        path: '/app/admin',
        element: <RoleProtectedRoute allowedRoles={['admin']} />,
        children: [
          {
            element: <AdminPortalLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboard /> },
              { path: 'underserved-areas', element: <UnderservedAreas /> },
              { path: 'events-management', element: <EventsManagement /> },
              { path: 'teacher-directory', element: <TeacherDirectory /> },
            ],
          },
        ],
      },
      {
        path: '/app/teacher',
        element: <RoleProtectedRoute allowedRoles={['teacher']} />,
        children: [
          {
            element: <TeacherPortalLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <TeacherDashboard /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}