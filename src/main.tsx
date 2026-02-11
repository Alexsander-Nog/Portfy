
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { LocaleProvider } from "./app/i18n.tsx";
  import { ToastProvider } from "./app/components/ui/toast.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <LocaleProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LocaleProvider>
  );

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          const scriptUrl = registration.active?.scriptURL ?? '';
          if (scriptUrl && (scriptUrl.includes('service-worker') || scriptUrl.includes('sw.js'))) {
            registration.unregister().catch(() => {
              // noop
            });
          }
        });
      })
      .catch(() => {
        // noop
      });
  }
  