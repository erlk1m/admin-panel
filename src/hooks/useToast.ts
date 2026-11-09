"use client";

import { useCallback, useRef, useState } from "react";
import { ToastMessage } from "@/types/admin";

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastSeqRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      toastSeqRef.current += 1;
      const id = `t_${toastSeqRef.current}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return { toasts, showToast, dismissToast };
}

