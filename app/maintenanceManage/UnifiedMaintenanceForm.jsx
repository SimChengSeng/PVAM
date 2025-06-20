import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
  useColorScheme,
} from "react-native";
import {
  Card,
  Text,
  TextInput,
  Button,
  Menu,
  Divider,
  SegmentedButtons,
  List,
  Provider as PaperProvider,
  useTheme,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Wrench, CalendarDays } from "lucide-react-native";
import { scheduleReminder } from "../../utils/notifications/scheduleReminder";
import { autoScheduleAllReminders } from "../../utils/notifications/autoScheduleAllReminders";
import { addMonths } from "date-fns";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function UnifiedMaintenanceForm() {
  const params = useLocalSearchParams();
  const { vehicleId, plateNumber, brand, model, userEmail } = params;
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const [mode, setMode] = useState("future");
  const [services, setServices] = useState([
    { selectedService: null, cost: "", menuVisible: false },
  ]);
  const [mileage, setMileage] = useState("");
  const [availableParts, setAvailableParts] = useState([]);
  const [notes, setNotes] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [serviceTax, setServiceTax] = useState("0");
  const [nextServiceDate, setNextServiceDate] = useState(new Date());
  const [nextServiceMileage, setNextServiceMileage] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderOptions, setReminderOptions] = useState({
    "1d": false,
    "3d": true,
    "7d": false,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [customServices, setCustomServices] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
      if (vehicleDoc.exists())
        setAvailableParts(vehicleDoc.data().partCondition || []);
    };
    fetchData();
  }, []);

  const updateService = (index, key, value) => {
    const updated = [...services];
    updated[index][key] = value;
    setServices(updated);
  };

  const updateCustomService = (index, value) => {
    setCustomServices((prev) => ({ ...prev, [index]: value }));
  };

  const addServiceField = () => {
    setServices((prev) => [
      ...prev,
      { selectedService: null, cost: "", menuVisible: false },
    ]);
  };

  const removeServiceField = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const totalServiceCost = services.reduce(
    (sum, s) => sum + parseFloat(s.cost || 0),
    0
  );
  const totalCost =
    totalServiceCost + parseFloat(laborCost) + parseFloat(serviceTax);

  const handleConfirm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const serviceDetails = services
      .map(({ selectedService, cost }, idx) => {
        if (!selectedService) return null;
        if (selectedService === "custom") {
          const customName = (customServices[idx] || "").trim();
          if (!customName) return null;
          return {
            name: customName,
            partId: "custom",
            cost: cost ? parseFloat(cost) : undefined,
          };
        }
        const part = availableParts.find((p) => p.partId === selectedService);
        return part
          ? {
              name: part.name,
              partId: part.partId,
              cost: cost ? parseFloat(cost) : undefined,
            }
          : null;
      })
      .filter(Boolean);

    if (!mileage || serviceDetails.length === 0) {
      Alert.alert("Error", "Please complete all required fields.");
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const serviceDetails = services
        .map(({ selectedService, cost }, idx) => {
          if (!selectedService) return null;
          if (selectedService === "custom") {
            const customName = (customServices[idx] || "").trim();
            if (!customName) return null;
            return {
              name: customName,
              partId: "custom",
              cost: cost && !isNaN(Number(cost)) ? parseFloat(cost) : 0,
            };
          }
          const part = availableParts.find((p) => p.partId === selectedService);
          return part
            ? {
                name: part.name,
                partId: part.partId,
                cost: cost && !isNaN(Number(cost)) ? parseFloat(cost) : 0,
              }
            : null;
        })
        .filter(Boolean);

      if (!mileage || serviceDetails.length === 0) {
        setLoading(false);
        Alert.alert("Error", "Please complete all required fields.");
        return;
      }

      const data = {
        userEmail,
        vehicleId,
        plate: plateNumber,
        type: serviceDetails.map((s) => s.name).join(", ") || "N/A",
        services: serviceDetails,
        currentServiceMileage: parseInt(mileage),
        nextServiceDate:
          mode === "future"
            ? nextServiceDate.toISOString().split("T")[0]
            : "N/A",
        nextServiceMileage:
          mode === "future" ? parseInt(nextServiceMileage) || "N/A" : "N/A",
        serviceDate:
          mode === "past" ? serviceDate.toISOString().split("T")[0] : "N/A",
        mechanic: mechanic.trim() || null,
        notes: notes.trim() || null,
        maintenanceCategory: "General Maintenance",
        laborCost:
          laborCost && !isNaN(Number(laborCost)) ? parseFloat(laborCost) : 0, // <-- default to 0
        serviceTax:
          serviceTax && !isNaN(Number(serviceTax)) ? parseFloat(serviceTax) : 0, // <-- default to 0
        cost: totalCost && !isNaN(Number(totalCost)) ? totalCost : 0, // <-- default to 0
        statusDone: mode === "past",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "maintenanceRecords"), data);

      if (mode === "past") {
        const vehicleDocRef = doc(db, "vehicles", vehicleId);
        const vehicleSnap = await getDoc(vehicleDocRef);
        if (vehicleSnap.exists()) {
          const vehicleData = vehicleSnap.data();
          const updatedParts = vehicleData.partCondition.map((part) => {
            const serviced = serviceDetails.find(
              (s) => s.partId === part.partId
            );
            if (serviced) {
              const lastDate = serviceDate.toISOString().split("T")[0];
              const lastMileage = parseInt(mileage);
              const nextMileage = lastMileage + (part.defaultLifespanKm || 0);
              const nextDate = addMonths(
                serviceDate,
                part.defaultLifespanMonth || 0
              )
                .toISOString()
                .split("T")[0];

              return {
                ...part,
                lastServiceDate: lastDate,
                lastServiceMileage: lastMileage,
                nextServiceDate: nextDate,
                nextServiceMileage: nextMileage,
              };
            }
            return part;
          });

          await updateDoc(vehicleDocRef, {
            partCondition: updatedParts,
            updatedAt: new Date(),
          });
        }
      }

      if (mode === "future") {
        await autoScheduleAllReminders(
          nextServiceDate,
          docRef.id,
          plateNumber,
          brand,
          model
        );
      }

      setLoading(false);
      Alert.alert(
        "Success",
        `${mode === "past" ? "History" : "Reminder"} saved successfully.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to save maintenance record.");
    }
  };

  const themedPaper =
    colorScheme === "dark" ? { ...MD3DarkTheme } : { ...MD3LightTheme };

  return (
    <PaperProvider theme={themedPaper}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: themedPaper.colors.background },
        ]}
      >
        <Text style={[styles.title, { color: themedPaper.colors.primary }]}>
          Maintenance Form
        </Text>
        {!showConfirm ? (
          <>
            <SegmentedButtons
              value={mode}
              onValueChange={setMode}
              buttons={[
                { value: "past", label: "Past Maintenance" },
                { value: "future", label: "Future Reminder" },
              ]}
              style={{ marginBottom: 16 }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={themedPaper.colors.onSurfaceVariant}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: themedPaper.colors.onSurfaceVariant,
                  fontSize: 14,
                  fontStyle: "italic",
                  flex: 1,
                }}
              >
                {mode === "past"
                  ? "Record maintenance that has already been completed."
                  : "Plan an upcoming service and receive reminders before it's due."}
              </Text>
            </View>

            <Card
              style={[
                styles.card,
                { backgroundColor: themedPaper.colors.surface },
              ]}
            >
              <Card.Title
                title={`Plate: ${plateNumber}`}
                subtitle={`Model: ${brand} ${model}`}
                titleStyle={{ color: themedPaper.colors.primary }}
                subtitleStyle={{ color: themedPaper.colors.onSurfaceVariant }}
              />
              <Card.Content>
                {services.map((service, index) => (
                  <View
                    key={index}
                    style={[
                      styles.serviceBox,
                      {
                        backgroundColor: themedPaper.colors.elevation.level1,
                        borderColor: themedPaper.colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.serviceTitle,
                        { color: themedPaper.colors.primary },
                      ]}
                    >
                      Service #{index + 1}
                    </Text>
                    <Menu
                      visible={service.menuVisible}
                      onDismiss={() =>
                        updateService(index, "menuVisible", false)
                      }
                      anchor={
                        <Button
                          icon={() => (
                            <Wrench
                              size={18}
                              color={themedPaper.colors.primary}
                            />
                          )}
                          mode="outlined"
                          onPress={() =>
                            updateService(index, "menuVisible", true)
                          }
                          textColor={themedPaper.colors.primary}
                        >
                          {service.selectedService === "custom"
                            ? customServices[index] || "Custom Service"
                            : service.selectedService
                            ? availableParts.find(
                                (p) => p.partId === service.selectedService
                              )?.name
                            : "Select Service"}
                        </Button>
                      }
                    >
                      {availableParts.map((part) => (
                        <Menu.Item
                          key={part.partId}
                          onPress={() => {
                            updateService(
                              index,
                              "selectedService",
                              part.partId
                            );
                            updateService(index, "menuVisible", false);
                            updateCustomService(index, ""); // clear custom if switching
                          }}
                          title={part.name}
                          titleStyle={{ color: themedPaper.colors.onSurface }}
                        />
                      ))}
                      <Divider />
                      <Menu.Item
                        key="custom"
                        onPress={() => {
                          updateService(index, "selectedService", "custom");
                          updateService(index, "menuVisible", false);
                        }}
                        title="Custom Service"
                        titleStyle={{
                          color: themedPaper.colors.primary,
                          fontStyle: "italic",
                        }}
                      />
                    </Menu>
                    {/* Show custom service input if selected */}
                    {service.selectedService === "custom" && (
                      <TextInput
                        label="Custom Service Name"
                        mode="outlined"
                        value={customServices[index] || ""}
                        onChangeText={(text) =>
                          updateCustomService(index, text)
                        }
                        style={{
                          marginBottom: 8,
                          backgroundColor: themedPaper.colors.surface,
                        }}
                        theme={{
                          colors: {
                            primary: themedPaper.colors.primary,
                            text: themedPaper.colors.onSurface,
                            placeholder: themedPaper.colors.onSurfaceVariant,
                            background: themedPaper.colors.surface,
                          },
                        }}
                        textColor={themedPaper.colors.onSurface}
                        placeholderTextColor={
                          themedPaper.colors.onSurfaceVariant
                        }
                      />
                    )}
                    <TextInput
                      label="Cost (RM) (optional)"
                      mode="outlined"
                      keyboardType="numeric"
                      value={service.cost}
                      onChangeText={(text) =>
                        updateService(index, "cost", text)
                      }
                      style={{
                        marginBottom: 8,
                        backgroundColor: themedPaper.colors.surface,
                      }}
                      theme={{
                        colors: {
                          primary: themedPaper.colors.primary,
                          text: themedPaper.colors.onSurface,
                          placeholder: themedPaper.colors.onSurfaceVariant,
                          background: themedPaper.colors.surface,
                        },
                      }}
                      textColor={themedPaper.colors.onSurface}
                      placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                    />
                    {services.length > 1 && (
                      <Button
                        icon="trash-can-outline"
                        mode="outlined"
                        onPress={() => removeServiceField(index)}
                        textColor={themedPaper.colors.error}
                        style={{
                          borderColor: themedPaper.colors.error,
                          borderRadius: 99,
                          alignSelf: "flex-end",
                        }}
                      >
                        Remove Service
                      </Button>
                    )}
                  </View>
                ))}
                <Button
                  icon="plus"
                  mode="contained"
                  onPress={addServiceField}
                  style={{
                    marginTop: 4,
                    alignSelf: "center",
                    backgroundColor: themedPaper.colors.primary,
                    borderRadius: 99,
                  }}
                  textColor={themedPaper.colors.onPrimary}
                >
                  Add Another Service
                </Button>
              </Card.Content>
            </Card>
            {mode === "future" && (
              <Card
                style={[
                  styles.card,
                  { backgroundColor: themedPaper.colors.surface },
                ]}
              >
                <Card.Title
                  title="Next Service"
                  titleStyle={{ color: themedPaper.colors.primary }}
                />
                <Card.Content>
                  <TextInput
                    label="Current Mileage (km)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={mileage}
                    onChangeText={setMileage}
                    style={[
                      styles.input,
                      { backgroundColor: themedPaper.colors.surface },
                    ]}
                    theme={{
                      colors: {
                        primary: themedPaper.colors.primary,
                        text: themedPaper.colors.onSurface,
                        placeholder: themedPaper.colors.onSurfaceVariant,
                        background: themedPaper.colors.surface,
                      },
                    }}
                    textColor={themedPaper.colors.onSurface}
                    placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                  />
                  <TextInput
                    label="Next Service Mileage (km)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={nextServiceMileage}
                    onChangeText={setNextServiceMileage}
                    style={[
                      styles.input,
                      { backgroundColor: themedPaper.colors.surface },
                    ]}
                    theme={{
                      colors: {
                        primary: themedPaper.colors.primary,
                        text: themedPaper.colors.onSurface,
                        placeholder: themedPaper.colors.onSurfaceVariant,
                        background: themedPaper.colors.surface,
                      },
                    }}
                    textColor={themedPaper.colors.onSurface}
                    placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                  />
                  <Button
                    icon={() => (
                      <CalendarDays
                        size={18}
                        color={themedPaper.colors.primary}
                      />
                    )}
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={styles.input}
                    textColor={themedPaper.colors.primary}
                  >
                    {`Next Service Date: ${
                      nextServiceDate.toISOString().split("T")[0]
                    }`}
                  </Button>
                  {showDatePicker && (
                    <DateTimePicker
                      value={nextServiceDate}
                      mode="date"
                      display="default"
                      onChange={(e, date) => {
                        setShowDatePicker(false);
                        if (date) setNextServiceDate(date);
                      }}
                    />
                  )}
                </Card.Content>
              </Card>
            )}
            {mode === "past" && (
              <Card
                style={[
                  styles.card,
                  { backgroundColor: themedPaper.colors.surface },
                ]}
              >
                <Card.Title
                  title="Service History Info"
                  titleStyle={{ color: themedPaper.colors.primary }}
                />
                <Card.Content>
                  <Text
                    style={{
                      marginBottom: 4,
                      color: themedPaper.colors.onSurfaceVariant,
                    }}
                  >
                    {vehicleDoc.mileage}
                  </Text>
                  <TextInput
                    label="Service Mileage (km)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={mileage}
                    onChangeText={setMileage}
                    style={[
                      styles.input,
                      { backgroundColor: themedPaper.colors.surface },
                    ]}
                    theme={{
                      colors: {
                        primary: themedPaper.colors.primary,
                        text: themedPaper.colors.onSurface,
                        placeholder: themedPaper.colors.onSurfaceVariant,
                        background: themedPaper.colors.surface,
                      },
                    }}
                    textColor={themedPaper.colors.onSurface}
                    placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                  />
                  <Button
                    icon={() => (
                      <CalendarDays
                        size={18}
                        color={themedPaper.colors.primary}
                      />
                    )}
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={styles.input}
                    textColor={themedPaper.colors.primary}
                  >
                    {`Service Date: ${serviceDate.toISOString().split("T")[0]}`}
                  </Button>
                  {showDatePicker && (
                    <DateTimePicker
                      value={serviceDate}
                      mode="date"
                      display="default"
                      onChange={(e, date) => {
                        setShowDatePicker(false);
                        if (date) setServiceDate(date);
                      }}
                    />
                  )}
                </Card.Content>
              </Card>
            )}
            {/* Advanced Options */}
            <Card
              style={[
                styles.card,
                { backgroundColor: themedPaper.colors.surface },
              ]}
            >
              <Card.Title
                title="Advanced Options"
                titleStyle={{ color: themedPaper.colors.primary }}
              />
              <Card.Content>
                <List.Accordion
                  title="Cost Details"
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="cash-multiple"
                      color={themedPaper.colors.primary}
                    />
                  )}
                  style={styles.accordion}
                  theme={{ colors: { background: "transparent" } }}
                >
                  <View
                    style={[
                      styles.accordionContent,
                      { backgroundColor: themedPaper.colors.elevation.level1 },
                    ]}
                  >
                    <TextInput
                      label="Labor Cost"
                      mode="outlined"
                      keyboardType="numeric"
                      value={laborCost}
                      onChangeText={setLaborCost}
                      style={styles.inputRounded}
                      theme={{
                        colors: {
                          primary: themedPaper.colors.primary,
                          text: themedPaper.colors.onSurface,
                          placeholder: themedPaper.colors.onSurfaceVariant,
                          background: themedPaper.colors.surface,
                        },
                      }}
                      textColor={themedPaper.colors.onSurface}
                      placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                    />
                    <TextInput
                      label="Service Tax"
                      mode="outlined"
                      keyboardType="numeric"
                      value={serviceTax}
                      onChangeText={setServiceTax}
                      style={styles.inputRounded}
                      theme={{
                        colors: {
                          primary: themedPaper.colors.primary,
                          text: themedPaper.colors.onSurface,
                          placeholder: themedPaper.colors.onSurfaceVariant,
                          background: themedPaper.colors.surface,
                        },
                      }}
                      textColor={themedPaper.colors.onSurface}
                      placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.totalCostText,
                        { color: themedPaper.colors.primary },
                      ]}
                    >
                      Total Cost: RM {totalCost.toFixed(2)}
                    </Text>
                  </View>
                </List.Accordion>
                <List.Accordion
                  title="Mechanic & Notes"
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="account-wrench"
                      color={themedPaper.colors.primary}
                    />
                  )}
                  style={styles.accordion}
                  theme={{ colors: { background: "transparent" } }}
                >
                  <View
                    style={[
                      styles.accordionContent,
                      { backgroundColor: themedPaper.colors.elevation.level1 },
                    ]}
                  >
                    <TextInput
                      label="Mechanic"
                      mode="outlined"
                      value={mechanic}
                      onChangeText={setMechanic}
                      style={styles.inputRounded}
                      theme={{
                        colors: {
                          primary: themedPaper.colors.primary,
                          text: themedPaper.colors.onSurface,
                          placeholder: themedPaper.colors.onSurfaceVariant,
                          background: themedPaper.colors.surface,
                        },
                      }}
                      textColor={themedPaper.colors.onSurface}
                      placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                    />
                    <TextInput
                      label="Notes"
                      mode="outlined"
                      multiline
                      value={notes}
                      onChangeText={setNotes}
                      style={styles.inputRounded}
                      theme={{
                        colors: {
                          primary: themedPaper.colors.primary,
                          text: themedPaper.colors.onSurface,
                          placeholder: themedPaper.colors.onSurfaceVariant,
                          background: themedPaper.colors.surface,
                        },
                      }}
                      textColor={themedPaper.colors.onSurface}
                      placeholderTextColor={themedPaper.colors.onSurfaceVariant}
                    />
                  </View>
                </List.Accordion>
                <Text
                  style={[
                    styles.totalCostText,
                    { color: themedPaper.colors.primary },
                  ]}
                >
                  Total Cost: RM {totalCost.toFixed(2)}
                </Text>
              </Card.Content>
            </Card>
            <Button
              icon="check-circle"
              mode="contained-tonal"
              compact
              onPress={handleConfirm}
              style={{
                marginVertical: 16,
                backgroundColor: themedPaper.colors.primary,
              }}
              textColor={themedPaper.colors.onPrimary}
              loading={loading}
              disabled={loading}
            >
              Review Before Submit
            </Button>
          </>
        ) : (
          <>
            <Card
              style={[
                styles.previewCard,
                { backgroundColor: themedPaper.colors.elevation.level1 },
              ]}
            >
              <Card.Title
                title={
                  mode === "future"
                    ? "🧾 Confirm Upcoming Maintenance"
                    : "🧾 Confirm Maintenance Record"
                }
                titleStyle={[
                  styles.cardTitle,
                  { color: themedPaper.colors.primary },
                ]}
              />
              <Card.Content>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      { color: themedPaper.colors.primary },
                    ]}
                  >
                    🚘 Plate:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      { color: themedPaper.colors.onSurface },
                    ]}
                  >
                    {plateNumber}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      { color: themedPaper.colors.primary },
                    ]}
                  >
                    📍 Model:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      { color: themedPaper.colors.onSurface },
                    ]}
                  >
                    {brand} {model}
                  </Text>
                </View>
                <Divider style={styles.divider} />
                {mode === "future" ? (
                  <>
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.label,
                          { color: themedPaper.colors.primary },
                        ]}
                      >
                        📅 Next Service Date:
                      </Text>
                      <Text
                        style={[
                          styles.value,
                          { color: themedPaper.colors.onSurface },
                        ]}
                      >
                        {nextServiceDate.toISOString().split("T")[0]}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.label,
                          { color: themedPaper.colors.primary },
                        ]}
                      >
                        📏 Current Mileage:
                      </Text>
                      <Text
                        style={[
                          styles.value,
                          { color: themedPaper.colors.onSurface },
                        ]}
                      >
                        {mileage} km
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.label,
                          { color: themedPaper.colors.primary },
                        ]}
                      >
                        🔜 Next Service Mileage:
                      </Text>
                      <Text
                        style={[
                          styles.value,
                          { color: themedPaper.colors.onSurface },
                        ]}
                      >
                        {nextServiceMileage || "-"}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.label,
                          { color: themedPaper.colors.primary },
                        ]}
                      >
                        🗓 Service Date:
                      </Text>
                      <Text
                        style={[
                          styles.value,
                          { color: themedPaper.colors.onSurface },
                        ]}
                      >
                        {serviceDate.toISOString().split("T")[0]}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.label,
                          { color: themedPaper.colors.primary },
                        ]}
                      >
                        📏 Mileage:
                      </Text>
                      <Text
                        style={[
                          styles.value,
                          { color: themedPaper.colors.onSurface },
                        ]}
                      >
                        {mileage} km
                      </Text>
                    </View>
                  </>
                )}
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      { color: themedPaper.colors.primary },
                    ]}
                  >
                    🔧 Mechanic:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      { color: themedPaper.colors.onSurface },
                    ]}
                  >
                    {mechanic || "-"}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      { color: themedPaper.colors.primary },
                    ]}
                  >
                    🧮 Labor Cost:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      { color: themedPaper.colors.onSurface },
                    ]}
                  >
                    RM {laborCost || 0}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      { color: themedPaper.colors.primary },
                    ]}
                  >
                    💸 Service Tax:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      { color: themedPaper.colors.onSurface },
                    ]}
                  >
                    RM {serviceTax || 0}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      { color: themedPaper.colors.primary },
                    ]}
                  >
                    📝 Notes:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      { color: themedPaper.colors.onSurface },
                    ]}
                  >
                    {notes || "-"}
                  </Text>
                </View>
                <Divider style={styles.divider} />
                <Text
                  style={[
                    styles.label,
                    { marginBottom: 8, color: themedPaper.colors.primary },
                  ]}
                >
                  🧰 Services:
                </Text>
                {services.map((service, index) => {
                  const part = availableParts.find(
                    (p) => p.partId === service.selectedService
                  );
                  return part ? (
                    <Text
                      key={index}
                      style={[
                        styles.serviceItem,
                        { color: themedPaper.colors.onSurface },
                      ]}
                    >
                      • {part.name} - RM {service.cost}
                    </Text>
                  ) : null;
                })}
                <Divider style={styles.divider} />
                <Text
                  style={[styles.total, { color: themedPaper.colors.primary }]}
                >
                  💰 Total Cost: RM {totalCost.toFixed(2)}
                </Text>
              </Card.Content>
            </Card>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <Button
                icon="arrow-left"
                mode="outlined"
                compact
                onPress={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  marginRight: 8,
                  borderColor: themedPaper.colors.primary,
                }}
                textColor={themedPaper.colors.primary}
              >
                Back
              </Button>
              <Button
                icon="content-save-check"
                mode="contained-tonal"
                compact
                onPress={handleSubmit}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  backgroundColor: themedPaper.colors.primary,
                }}
                loading={loading}
                disabled={loading}
                textColor={themedPaper.colors.onPrimary}
              >
                Confirm & Save
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "transparent",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  serviceBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  input: {
    marginBottom: 16,
  },
  accordion: {
    backgroundColor: "transparent",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  accordionContent: {
    padding: 12,
  },
  inputRounded: {
    marginBottom: 12,
  },
  totalCostText: {
    marginVertical: 8,
    fontWeight: "bold",
    fontSize: 16,
  },
  previewCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontWeight: "600",
    marginBottom: 0,
    fontSize: 14,
  },
  value: {
    fontWeight: "500",
  },
  divider: {
    marginVertical: 10,
  },
  serviceItem: {
    marginLeft: 4,
    fontWeight: "500",
  },
  total: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
  },
});
