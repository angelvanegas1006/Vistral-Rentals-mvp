"use client";

import { useState, useCallback } from "react";

export interface PendingTransition {
  lpId: string;
  fromPhase: string;
  toPhase: string;
  propertyAddress: string;
  direction: "forward" | "backward";
  newStatus: string;
  action: "advance" | "undo" | "revive" | "revert";
  updates: Record<string, unknown>;
}

export interface UseMtpTransitionOptions {
  leadId: string;
  onSuccess?: () => void | Promise<void>;
  onError?: (error: string) => void;
}

export function useMtpTransition({
  leadId,
  onSuccess,
  onError,
}: UseMtpTransitionOptions) {
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const [loading, setLoading] = useState(false);

  const executeTransition = useCallback(
    async (
      lpId: string,
      newStatus: string,
      action: "advance" | "undo" | "revive" | "revert",
      updates: Record<string, unknown>,
      confirmed = false
    ) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/leads/${encodeURIComponent(leadId)}/properties/${encodeURIComponent(lpId)}/transition`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newStatus,
              action,
              confirmed,
              updates,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          onError?.(data.error || "Error en transición");
          return { completed: false };
        }

        if (data.requiresConfirmation && !confirmed) {
          setPending({
            lpId,
            fromPhase: data.fromPhase,
            toPhase: data.toPhase,
            propertyAddress: data.propertyAddress,
            direction: action === "undo" || action === "revert" ? "backward" : "forward",
            newStatus,
            action,
            updates,
          });
          return { completed: false };
        }

        setPending(null);
        await onSuccess?.();
        return { completed: true };
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Error en transición");
        return { completed: false };
      } finally {
        setLoading(false);
      }
    },
    [leadId, onSuccess, onError]
  );

  const confirmTransition = useCallback(async () => {
    if (!pending) return;
    await executeTransition(
      pending.lpId,
      pending.newStatus,
      pending.action,
      pending.updates,
      true
    );
  }, [pending, executeTransition]);

  const cancelTransition = useCallback(() => {
    setPending(null);
  }, []);

  return {
    transition: executeTransition,
    pendingConfirmation: pending,
    confirmTransition,
    cancelTransition,
    loading,
  };
}
