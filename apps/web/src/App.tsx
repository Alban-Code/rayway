import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthPage } from "@/pages/AuthPage";
import { AccountPage } from '@/pages/AccountPage';
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RedirectIfAuth } from "@/components/auth/RedirectIfAuth";
import { CardsPage } from "@/pages/CardsPage";
import { CardDetailSheet } from "./components/cards/CardDetailSheet";

const router = createBrowserRouter([
  { path: '/', element: <div>Home</div> },
  {
    element: <RedirectIfAuth />,
    children: [
      { path: "/sign-in", element: <AuthPage /> },
      { path: "/sign-up", element: <AuthPage /> }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/account', element: <AccountPage /> },
    ]
  },
  {
    path: '/cards', element: <CardsPage />, children: [
      { path: '/cards/:code', element: <CardDetailSheet /> }
    ]
  },

])

function App() {
  return <RouterProvider router={router} />
}

export default App
