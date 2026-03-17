import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen text-black dark:text-white">
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </div>
  );
}

export default App;