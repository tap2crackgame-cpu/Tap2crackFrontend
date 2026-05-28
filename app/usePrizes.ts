import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { DbWinner } from "@/types/game";
import { fetchUserPrizes } from "@/services/userPrizes";


export function useUserPrizes() {
  const { token } = useAuth();

  const [crackPrizes, setCrackPrizes] = useState<DbWinner[]>([]);
  const [crackPrizesLoading, setLoading] = useState(false);

  const fetchPrizes = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const prizes = await fetchUserPrizes(token);
      setCrackPrizes(prizes);
    } catch (err) {
      console.log("PRIZES ERROR:", err);
      setCrackPrizes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchPrizes();
  }, [fetchPrizes]);

  return {
    crackPrizes,
    crackPrizesLoading,
    refetch: fetchPrizes,
  };
}