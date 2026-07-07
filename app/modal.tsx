import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { X, Bell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Tap2CrackModal() {
  return (
    <Modal animationType="fade" transparent visible onRequestClose={() => router.back()}>
      <Pressable style={styles.overlay} onPress={() => router.back()}>
        <View style={styles.modalBox}>
          <LinearGradient colors={["#2D2D44", "#1a1a2e"]} style={styles.gradient}>
            <View style={styles.header}>
              <View style={styles.iconBg}>
                <Bell size={24} color="#FFD700" />
              </View>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Notification Center</Text>
            <Text style={styles.message}>Check back for new eggs and prizes!</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()}>
              <Text style={styles.actionText}>Got It</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Pressable>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", borderRadius: 20, overflow: "hidden" },
  gradient: { padding: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  iconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,215,0,0.2)", justifyContent: "center", alignItems: "center" },
  closeBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF", marginBottom: 8 },
  message: { fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 20 },
  actionBtn: { backgroundColor: "#4ECDC4", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  actionText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
