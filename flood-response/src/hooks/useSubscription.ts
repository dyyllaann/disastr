import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubscription, deleteSubscription } from "../api/client";
import type { CreateSubscriptionPayload } from "../types";

export function useSubscription() {
  const qc = useQueryClient();

  const subscribe = useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) =>
      createSubscription(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const unsubscribe = useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  return { subscribe, unsubscribe };
}
