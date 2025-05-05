import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Light background
    alignItems: "center",
  },
  list: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Light gray background for lists
  },
  card: {
    backgroundColor: "#ffffff", // White card background
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007aff", // Blue button
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    position: "absolute",
    bottom: 30,
    right: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  addText: {
    color: "#ffffff", // White text for the button
    marginLeft: 8,
    fontWeight: "600",
  },
  newStyle: {
    fontSize: 14,
    color: "#ff0000", // Red text
    marginTop: 10,
  },
  label: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#333",
  },
  value: {
    marginBottom: 12,
    color: "#333",
  },
  input: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  // Empty state styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#555", // Darker gray for empty state title
    marginTop: 12,
    fontWeight: "600",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#777", // Medium gray for empty state message
    textAlign: "center",
    marginTop: 4,
  },

  // Vehicle name and details
  vehicleName: {
    fontSize: 16,
    color: "#333", // Darker text for vehicle name
    fontWeight: "bold",
  },
  textDetail: {
    marginTop: 4,
    color: "#666", // Medium gray for details
  },
});
