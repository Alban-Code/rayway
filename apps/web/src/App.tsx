import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthPage } from "@/pages/AuthPage";
import { AccountPage } from '@/pages/AccountPage';
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RedirectIfAuth } from "@/components/auth/RedirectIfAuth";
import { CardsPage } from "@/pages/CardsPage";
import { CardDetailSheet } from "@/components/cards/detail/CardDetailSheet";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Home } from "@/pages/Home";
import { DecksPage } from "@/pages/DecksPage";
import { DeckDetailPage } from "./pages/DeckDetailPage";
import { DeckCardSheet } from "@/components/decks/detail/DeckCardSheet";

const router = createBrowserRouter([
  {
    element: <RedirectIfAuth />,
    children: [
      { path: "/sign-in", element: <AuthPage /> },
      { path: "/sign-up", element: <AuthPage /> }
    ]
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Home /> },
      {
        path: '/cards', element: <CardsPage />, children: [
          { path: '/cards/:code', element: <CardDetailSheet /> }
        ]
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/account', element: <AccountPage /> },
          { path: '/decks', element: <DecksPage /> },
          {
            path: "/decks/:id", element: <DeckDetailPage />, children: [
              { path: "/decks/:id/:variantCode", element: <DeckCardSheet /> }
            ]
          }
        ]
      },
    ]
  }
])

function App() {
  return <RouterProvider router={router} />
}

export default App
