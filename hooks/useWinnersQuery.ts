import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWinners } from "@/services/fetchleaderboard";
import { normalizeWinner, type Winner } from "@/types/game";
import { useSocket } from "@/hooks/SocketContext";

export function useWinnersQuery(limit = 50) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery<Winner[]>({
    queryKey: ["winners", limit],
    queryFn: async () => {
      const rows = await fetchWinners(limit);
      if (!Array.isArray(rows)) return [];
      return rows.map((row) =>
        normalizeWinner(row as Record<string, unknown>)
      );
    },
    staleTime: 15000,
    refetchInterval: 45000,
  });

  useEffect(() => {
    if (!socket) return;

    const onEggCracked = (data: { winner?: Record<string, unknown> | null }) => {
      if (!data?.winner) return;

      const incoming = normalizeWinner(data.winner);

      queryClient.setQueryData<Winner[]>(["winners", limit], (prev = []) => {
        const withoutDup = prev.filter((w) => w.id !== incoming.id);
        return [incoming, ...withoutDup].slice(0, limit);
      });

      void queryClient.invalidateQueries({ queryKey: ["winners"] });
    };

    socket.on("egg_cracked", onEggCracked);
    return () => {
      socket.off("egg_cracked", onEggCracked);
    };
  }, [socket, queryClient, limit]);

  return query;
}
