import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  subText: {
    marginTop: 4,
    color: "#bbb",
    marginBottom: 12,
  },
  maintenanceCard: {
    backgroundColor: "#2a2a3d",
    borderRadius: 16,
    marginTop: 20,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 12,
  },
  maintenanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#ccc",
    marginTop: 12,
    fontWeight: "600",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 4,
  },
});

export default styles;
