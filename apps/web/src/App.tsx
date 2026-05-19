import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  { path: '/', element: <div>Home</div> },
  { path: '/sign-in', element: <div>Sign in</div> },
  { path: '/sign-up', element: <div>Sign up</div> },
  { path: '/account', element: <div>Account</div> },
  { path: '/cards', element: <div>Cards list</div> },
  { path: '/cards/:code', element: <div>Card detail</div> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
