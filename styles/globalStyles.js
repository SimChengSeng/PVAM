import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  generalPadding: { paddingHorizontal: 10, paddingTop: 50 },
  container: {
    flex: 1,
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 6,
    // elevation: 4,
    borderWidth: 1,
  },
  cardHeaderTitle: {
    fontWeight: "bold",
    fontSize: 20,
  },
  cardHeaderSubtitle: {
    fontSize: 13,
  },
  label: {
    marginTop: 8,
    fontWeight: "bold",
  },
  value: {
    marginBottom: 12,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 12,
    fontWeight: "600",
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  textDetail: {
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    position: "absolute",
    bottom: 30,
    right: 30,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  addText: {
    marginLeft: 8,
    fontWeight: "600",
  },
});

export const getThemedStyles = (theme) => ({
  containerBg: {
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor:
      theme.colors.elevation?.level1 || theme.colors.secondaryContainer,
    shadowColor: theme.colors.shadow || "#000",
    borderColor: theme.colors.outlineVariant || "#e0e0e0",
  },
  cardHeaderTitle: {
    color: theme.colors.onSurface,
  },
  cardHeaderSubtitle: {
    color: theme.colors.onSurfaceVariant,
  },

  label: {
    color: theme.colors.onSurface,
  },
  value: {
    color: theme.colors.onSurfaceVariant || theme.colors.onSurface,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant || "#eee",
    color: theme.colors.onSurface,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
  },
  emptyMessage: {
    color: theme.colors.outline,
  },
  vehicleName: {
    color: theme.colors.onSurface,
  },
  textDetail: {
    color: theme.colors.onSurfaceVariant || theme.colors.onSurface,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.shadow || "#000",
  },
  addText: {
    color: theme.colors.onPrimary,
  },
  newStyle: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 10,
  },
});
