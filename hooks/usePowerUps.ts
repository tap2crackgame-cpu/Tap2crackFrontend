import { useEffect, useCallback, useState } from "react";
import { PowerUp, PowerUpType, mergePowerUpInventory } from "@/types/game";
import { useSocket } from "@/hooks/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { showAlertAsToast } from "@/context/ToastContext";

type InventoryCounts = Record<PowerUpType, number>;

type UsePowerUpSocketProps = {
  setInventory: React.Dispatch<React.SetStateAction<InventoryCounts>>;
  setActivePowerUp: React.Dispatch<React.SetStateAction<PowerUp | null>>;
  onNoInventory?: (type: PowerUpType) => void;
};

function powerUpLabel(type: PowerUpType | string, multiplier?: number): string {
  const t = String(type).toUpperCase();
  if (multiplier === 3 || t === "3X" || t === "X3") return "3x";
  return "2x";
}

export function usePowerUp({
  setInventory,
  setActivePowerUp,
  onNoInventory,
}: UsePowerUpSocketProps) {
  const socket = useSocket();
  const { authUser } = useAuth();
  const userId = authUser?.id;
  const [activatingPowerUp, setActivatingPowerUp] = useState<PowerUpType | null>(
    null
  );

  const activatePowerUp = useCallback(
    (type: PowerUpType) => {
      if (!socket || !userId) return;
      setActivatingPowerUp(type);
      socket.emit("activate_powerup", {
        userId,
        type,
      });
    },
    [socket, userId]
  );

  const purchasePowerUp = useCallback(
    (type: PowerUpType, quantity: number) => {
      if (!socket || !userId) return;

      socket.emit("purchase_powerup", {
        userId,
        type,
        quantity,
      });
    },
    [socket, userId]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("inventory_updated", (data: InventoryCounts) => {
      console.log(" SOCKET: inventory_updated:", data);
      setInventory(mergePowerUpInventory(data));
    });

    socket.on(
      "powerup_activated",
      (data: { type: PowerUpType; multiplier: number }) => {
        console.log(" SOCKET: powerup_activated received:", data);
        setActivatingPowerUp(null);
        setActivePowerUp({
          type: data.type,
          multiplier: data.multiplier,
          cost: 0,
          active: true,
          count: 1,
        });
        const label = powerUpLabel(data.type, data.multiplier);
        showAlertAsToast("Success", `${label} Tap Boost activated!`);
      }
    );

    socket.on("powerup_failed", (data: { reason: string; type?: PowerUpType }) => {
      console.error("❌ SOCKET: powerup_failed:", data.reason, "for type:", data.type);
      setActivatingPowerUp(null);
      if (data.reason === "NO_INVENTORY" && onNoInventory && data.type) {
        onNoInventory(data.type);
      }
    });

    return () => {
      socket.off("inventory_updated");
      socket.off("powerup_activated");
      socket.off("powerup_failed");
    };
  }, [socket, setInventory, setActivePowerUp, onNoInventory]);

  return {
    activatePowerUp,
    purchasePowerUp,
    activatingPowerUp,
  };
}
