import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { showAlertAsToast } from "@/context/ToastContext";
import { COUPON_CSV_TEMPLATE, parseCouponCsv, type CouponCsvResult, type CouponRow } from "@/utils/couponCsv";

/**
 * The coupon tab, in its own component. Its state lives here instead of in the big admin
 * screen, so typing or pasting no longer re-renders the whole 1,500-line dashboard.
 */
export default function CouponAdminPanel({ token, baseUrl }: { token: string | null; baseUrl: string }) {
  const queryClient = useQueryClient();
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [expiry, setExpiry] = useState("");
  const [creating, setCreating] = useState(false);

  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<CouponCsvResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failures, setFailures] = useState<string[]>([]);
  const [okCount, setOkCount] = useState<number | null>(null);
  const cancelRef = useRef(false);

  const post = useCallback(
    async (row: { code: string; name: string; description: string; expiresAt: string | null }) => {
      const res = await fetch(`${baseUrl}/admin/coupons`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.error || j?.message || msg; } catch {}
        throw new Error(msg);
      }
    },
    [baseUrl, token]
  );

  const addOne = async () => {
    if (!code.trim() || !company.trim() || !description.trim() || !expiry.trim()) {
      showAlertAsToast("Error", "Fill all fields");
      return;
    }
    const d = new Date(expiry.trim());
    if (isNaN(d.getTime())) {
      showAlertAsToast("Error", "Expiry must look like 2026-12-31");
      return;
    }
    setCreating(true);
    try {
      await post({ code: code.trim(), name: company.trim(), description: description.trim(), expiresAt: d.toISOString() });
      setCode(""); setCompany(""); setDescription(""); setExpiry("");
      queryClient.invalidateQueries({ queryKey: ["admin-coupon-codes"] });
      showAlertAsToast("Success", "Coupon created");
    } catch (e: any) {
      showAlertAsToast("Error", e?.message || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const pickCsv = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      showAlertAsToast("CSV upload", "CSV upload works on the web admin.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv,text/plain";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      setFileName(file.name);
      setParsed(parseCouponCsv(text));
      setFailures([]);
      setOkCount(null);
      setProgress({ done: 0, total: 0 });
    };
    input.click();
  };

  const downloadTemplate = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const url = URL.createObjectURL(new Blob([COUPON_CSV_TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "coupons-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const uploadAll = async () => {
    if (!parsed?.rows.length || uploading) return;
    const queue: CouponRow[] = [...parsed.rows];
    const failed: string[] = [];
    let ok = 0, done = 0;
    cancelRef.current = false;
    setUploading(true); setFailures([]); setOkCount(null);
    setProgress({ done: 0, total: queue.length });
    const total = queue.length;
    const worker = async () => {
      while (queue.length && !cancelRef.current) {
        const r = queue.shift()!;
        try {
          await post({ code: r.code, name: r.name, description: r.description, expiresAt: r.expiresAt });
          ok++;
        } catch (e: any) {
          failed.push(`Row ${r.line} (${r.code}): ${e?.message || "failed"}`);
        }
        done++;
        setProgress({ done, total });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]); // 4 at a time
    setUploading(false);
    setOkCount(ok);
    setFailures(failed);
    queryClient.invalidateQueries({ queryKey: ["admin-coupon-codes"] });
    showAlertAsToast(failed.length ? "Done with errors" : "Success", `${ok} of ${total} coupons added${failed.length ? `, ${failed.length} failed` : ""}`);
  };

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string, extra: object = {}) => (
    <View style={s.inputRow}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCorrect={false}
        spellCheck={false}
        blurOnSubmit={false}
        {...extra}
      />
    </View>
  );

  return (
    <>
      <View style={s.card}>
        <Text style={s.title}>Coupon Management</Text>
        {field("Company name", company, setCompany, "e.g. Acme Foods", { autoCapitalize: "words" })}
        {field("Coupon Description", description, setDescription, "e.g. Jumia 20% Discount")}
        {field("Code", code, setCode, "e.g. EGG-123-COUPON", { autoCapitalize: "characters" })}
        {field("Expiry Date", expiry, setExpiry, "YYYY-MM-DD", { maxLength: 10 })}
        <TouchableOpacity style={[s.btn, creating && s.off]} onPress={addOne} disabled={creating}>
          {creating ? <ActivityIndicator color="#1a1a2e" /> : <Text style={s.btnText}>Add code</Text>}
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.title}>📄 Upload many coupons (CSV)</Text>
        <Text style={s.hint}>
          Columns: code, company, description, expiry (YYYY-MM-DD or DD/MM/YYYY). A header row is optional. Expiry can be left blank.
        </Text>
        <View style={s.row}>
          <TouchableOpacity style={[s.btn, s.flex]} onPress={pickCsv} disabled={uploading}>
            <Text style={s.btnText}>{fileName ? "Choose another file" : "Choose CSV file"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.flex, s.ghost]} onPress={downloadTemplate}>
            <Text style={[s.btnText, { color: "#FFF" }]}>Template</Text>
          </TouchableOpacity>
        </View>

        {!!parsed && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.fileLine}>
              {fileName} · ✅ {parsed.rows.length} ready · {parsed.problems.length ? `⚠️ ${parsed.problems.length} skipped` : "no problems"}
            </Text>
            {parsed.problems.slice(0, 6).map((p, i) => (
              <Text key={i} style={s.problem}>Row {p.line}: {p.reason}</Text>
            ))}
            {parsed.problems.length > 6 && <Text style={s.problem}>…and {parsed.problems.length - 6} more</Text>}
            <TouchableOpacity
              style={[s.btn, (!parsed.rows.length || uploading) && s.off]}
              onPress={uploadAll}
              disabled={!parsed.rows.length || uploading}
            >
              {uploading ? (
                <Text style={s.btnText}>Uploading {progress.done}/{progress.total}…</Text>
              ) : (
                <Text style={s.btnText}>Upload {parsed.rows.length} coupons</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {okCount !== null && (
          <View style={{ marginTop: 10 }}>
            <Text style={s.fileLine}>🎉 {okCount} added{failures.length ? ` · ${failures.length} failed` : ""}</Text>
            {failures.slice(0, 10).map((f, i) => <Text key={i} style={s.problem}>{f}</Text>)}
            {failures.length > 10 && <Text style={s.problem}>…and {failures.length - 10} more</Text>}
          </View>
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  title: { fontSize: 13, fontWeight: "800", color: "#FFF", marginBottom: 10 },
  hint: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginBottom: 12, lineHeight: 18 },
  inputRow: { marginBottom: 10 },
  inputLabel: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: "700" },
  input: { height: 46, borderRadius: 12, paddingHorizontal: 12, color: "#FFF", backgroundColor: "rgba(0,0,0,0.25)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", fontWeight: "600" },
  btn: { marginTop: 6, backgroundColor: "#FFD700", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#1a1a2e", fontWeight: "900" },
  ghost: { backgroundColor: "rgba(255,255,255,0.1)" },
  off: { opacity: 0.5 },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  fileLine: { color: "#FFF", fontWeight: "700", fontSize: 13, marginBottom: 6 },
  problem: { color: "#FF9B9B", fontSize: 12, marginBottom: 2 },
});
