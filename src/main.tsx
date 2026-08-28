import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthContext.tsx'
import { Provider } from './components/ui/provider.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import { ITTeamProvider } from './features/admin/ITTeamContext.tsx'
import { LaptopsProvider } from './features/laptops/LaptopsContext.tsx'
import { NotificationsProvider } from './features/notifications/NotificationsContext.tsx'
import { TicketsProvider } from './features/tickets/TicketsContext.tsx'

const router = createBrowserRouter([
  { path: '/login', lazy: () => import('./auth/LoginPage.tsx') },
  {
    path: '/',
    lazy: () => import('./routes/RootLayout.tsx'),
    children: [
      { index: true, element: <Navigate to="/tickets" replace /> },
      {
        path: 'tickets',
        lazy: () => import('./routes/tickets/TicketsListPage.tsx'),
        children: [
          { path: ':id', lazy: () => import('./routes/tickets/TicketDetailDrawer.tsx') },
          { path: 'new', lazy: () => import('./routes/tickets/CreateTicketDialog.tsx') },
        ],
      },
      {
        path: 'laptops',
        lazy: () => import('./routes/laptops/LaptopsListPage.tsx'),
        children: [
          { path: ':id', lazy: () => import('./routes/laptops/LaptopDetailDrawer.tsx') },
          { path: 'new', lazy: () => import('./routes/laptops/AddLaptopDialog.tsx') },
        ],
      },
      {
        path: 'admin/it-team',
        lazy: () => import('./routes/admin/ITTeamPage.tsx'),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <AuthProvider>
        <ITTeamProvider>
          <NotificationsProvider>
            <LaptopsProvider>
              <TicketsProvider>
                <Toaster />
                <RouterProvider router={router} />
              </TicketsProvider>
            </LaptopsProvider>
          </NotificationsProvider>
        </ITTeamProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>,
)
