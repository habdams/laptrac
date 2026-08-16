import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Provider } from './components/ui/provider.tsx';
import App from './App.tsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "dashboard",
    // React Router automatically grabs 'Component' and 'clientLoader'
    lazy: () => import("./routes/Dashboard.tsx"),
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
