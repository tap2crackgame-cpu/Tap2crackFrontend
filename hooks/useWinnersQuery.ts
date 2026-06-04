import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWinners } from "@/services/fetchleaderboard";
import { normalizeWinner, type Winner } from "@/types/game";
import { useSocket } from "@/hooks/SocketContext";
import {
  loadCachedRecentWinners,
  mergeWinnersByRecency,
  saveCachedRecentWinners,
} from "@/utils/recentWinnersCache";

export function useWinnersQuery(limit = 50) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery<Winner[]>({
    queryKey: ["winners", limit],
    queryFn: async () => {
      const fromApi = await fetchWinners(limit);
      const cached = await loadCachedRecentWinners();
      const merged = mergeWinnersByRecency(fromApi, cached).slice(0, limit);
      await saveCachedRecentWinners(merged);
      return merged;
    },
    staleTime: 15000,
    refetchInterval: 45000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!socket) return;

    const onEggCracked = (data: { winner?: Record<string, unknown> | null }) => {
      if (!data?.winner) return;

      const incoming = normalizeWinner(data.winner);

      queryClient.setQueryData<Winner[]>(["winners", limit], (prev = []) => {
        const next = mergeWinnersByRecency([incoming], prev).slice(0, limit);
        void saveCachedRecentWinners(next);
        return next;
      });

      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["winners"] });
      }, 3000);
    };

    socket.on("egg_cracked", onEggCracked);
    return () => {
      socket.off("egg_cracked", onEggCracked);
    };
  }, [socket, queryClient, limit]);

  return query;
}
