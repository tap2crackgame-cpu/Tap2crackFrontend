import React from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

export const INK = "#1A1A2E";

// Same egg gradients as components/Egg.tsx, so landing and game match.
const EGGS: Record<string, [string, string]> = {
  normal: ["#F4A460", "#D2691E"], business: ["#4ECDC4", "#44B3AB"], company: ["#FF6B6B", "#EE5A5A"],
  silver: ["#E8E8E8", "#A0A0A0"], golden: ["#FFD700", "#FFA500"], "no-powerup": ["#FFFFFF", "#E0E0E0"],
};

export function EggArt({ type = "normal", size = 64, label }: { type?: string; size?: number; label?: string }) {
  const [a, b] = EGGS[type] ?? EGGS.normal;
  const id = `egg-${type}`;
  return (
    <Svg width={size} height={size * 1.26} viewBox="0 0 100 126" accessibilityRole="image" accessibilityLabel={label ?? `${type} egg`}>
      <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} /></LinearGradient></Defs>
      <Path d="M50 6C78 6 94 50 94 78C94 104 74 120 50 120C26 120 6 104 6 78C6 50 22 6 50 6Z" fill={`url(#${id})`} stroke={INK} strokeWidth={3} />
      <Ellipse cx={32} cy={52} rx={8} ry={16} fill="#fff" opacity={0.5} transform="rotate(16 32 52)" />
      <Path d="M62 30l-5 14 9 6" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Clucky — the Tap2Crack mascot. Use <Clucky size={56} /> anywhere (headings, modals, 404). */
export function Clucky({ size = 160, label = "Clucky, the Tap2Crack chicken", overlay }: { size?: number; label?: string; overlay?: React.ReactNode }) {
  const o = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityRole="image" accessibilityLabel={label}>
      <Defs>
        <RadialGradient id="kB" cx="0.35" cy="0.3" r="0.8"><Stop offset="0" stopColor="#fff" /><Stop offset="0.7" stopColor="#FFF1D6" /><Stop offset="1" stopColor="#F6D9A6" /></RadialGradient>
        <LinearGradient id="kC" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FF8A8A" /><Stop offset="1" stopColor="#EE4B4B" /></LinearGradient>
        <LinearGradient id="kK" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFC04D" /><Stop offset="1" stopColor="#FF8C00" /></LinearGradient>
      </Defs>
      <Ellipse cx={100} cy={186} rx={52} ry={8} fill="#000" opacity={0.25} />
      <G {...o}>
        <Path d="M146 120C170 84 196 96 188 130C182 146 164 150 148 144Z" fill="url(#kK)" />
        <Path d="M84 170L80 188M70 188L92 188M116 170L120 188M108 188L130 188" fill="none" stroke="url(#kK)" strokeWidth={7} />
        <Ellipse cx={100} cy={114} rx={66} ry={60} fill="url(#kB)" />
        <Circle cx={86} cy={40} r={12} fill="url(#kC)" /><Circle cx={102} cy={32} r={14} fill="url(#kC)" /><Circle cx={118} cy={42} r={11} fill="url(#kC)" />
        <Path d="M50 80C50 44 150 44 150 80L139 71L127 82L114 70L100 82L86 70L73 82L61 71Z" fill="#FFF8E7" />
        <Path d="M42 108C16 90 8 126 30 142C46 144 54 126 42 108Z" fill="#FFE2A8" />
        <Path d="M158 112C184 98 192 132 170 146C154 148 146 130 158 112Z" fill="#FFE2A8" />
      </G>
      <Circle cx={64} cy={118} r={10} fill="#FF9AA2" opacity={0.7} /><Circle cx={136} cy={118} r={10} fill="#FF9AA2" opacity={0.7} />
      <Ellipse cx={80} cy={100} rx={12} ry={14} fill="#fff" stroke={INK} strokeWidth={3} /><Ellipse cx={120} cy={100} rx={12} ry={14} fill="#fff" stroke={INK} strokeWidth={3} />
      <Circle cx={82} cy={102} r={8} fill={INK} /><Circle cx={118} cy={102} r={8} fill={INK} />
      <Circle cx={85} cy={98} r={3} fill="#fff" /><Circle cx={121} cy={98} r={3} fill="#fff" />
      <Path d="M88 114Q100 106 112 114Q108 130 100 132Q92 130 88 114Z" fill="url(#kK)" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <Ellipse cx={100} cy={140} rx={6} ry={8} fill="url(#kC)" stroke={INK} strokeWidth={3} />
      {overlay}
    </Svg>
  );
}
