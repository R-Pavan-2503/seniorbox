import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ToastMessage {
  id: number;
  text: string;
}

interface ToastContextValue {
  showToast: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const showToast = useCallback((text: string) => {
    const id = Date.now();
    setMessages((current) => [...current, { id, text }]);
    window.setTimeout(() => setMessages((current) => current.filter((message) => message.id !== id)), 3000);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="rounded-md border border-emerald-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 shadow-lg">
            {message.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};
