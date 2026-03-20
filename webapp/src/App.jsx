import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen text-black dark:text-white">
      <LanguageProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;