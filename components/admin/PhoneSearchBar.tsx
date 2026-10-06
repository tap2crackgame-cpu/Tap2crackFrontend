import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

/**
 * Search box with its own state. Typing only re-renders this small bar; the big admin screen
 * is told about the new text 250ms after you pause. Any characters work (+234, spaces, dashes, letters).
 */
export default function PhoneSearchBar({ value, onChange, placeholder = "Search phone, name or email…" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const type = (v: string) => {
    setDraft(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v.trim()), 250);
  };
  const searchNow = () => {
    if (timer.current) clearTimeout(timer.current);
    onChange(draft.trim());
  };
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    setDraft("");
    onChange("");
  };

  return (
    <View style={s.row}>
      <Text style={s.icon}>🔍</Text>
      <TextInput
        value={draft}
        onChangeText={type}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        keyboardType="default"
        returnKeyType="search"
        onSubmitEditing={searchNow}
        blurOnSubmit={false}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      <TouchableOpacity style={s.btn} onPress={searchNow}>
        <Text style={s.btnText}>Search</Text>
      </TouchableOpacity>
      {draft.length > 0 || value.length > 0 ? (
        <TouchableOpacity onPress={clear}>
          <Text style={s.clear}>Clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
  },
  icon: { fontSize: 16 },
  input: { flex: 1, color: "#FFF", fontSize: 15, paddingVertical: 0 },
  btn: { backgroundColor: "rgba(255,215,0,0.18)", borderWidth: 1, borderColor: "rgba(255,215,0,0.5)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnText: { color: "#FFD700", fontSize: 12, fontWeight: "700" },
  clear: { color: "#4ECDC4", fontSize: 13, fontWeight: "600" },
});
