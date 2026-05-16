import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTickets,
  getTicket,
  flagTicket,
  resolveTicket,
} from "../api/client";
import type { TicketsQuery } from "../types";

const TICKETS_KEY = "tickets";

export function useTickets(query?: TicketsQuery) {
  return useQuery({
    queryKey: [TICKETS_KEY, query],
    queryFn: () => getTickets(query),
    refetchInterval: 30_000, // poll every 30s
    staleTime: 15_000,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: [TICKETS_KEY, id],
    queryFn: () => getTicket(id),
    enabled: Boolean(id),
  });
}

export function useFlagTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: flagTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
}

export function useResolveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
}
