import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Button,
  RadioButton,
  Checkbox,
  TextInput,
  HelperText,
  SegmentedButtons,
  ActivityIndicator,
} from "react-native-paper";
import { db, auth } from "../../../config/FirebaseConfig";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// Behavior Questions
const dbqItems = [
  {
    key: "speed",
    label: "How often do you exceed speed limits?",
  },
  {
    key: "phone",
    label: "How often do you use your phone while driving?",
  },
  {
    key: "gap",
    label: "Do you misjudge safe overtaking gaps?",
  },
  {
    key: "signal",
    label: "Do you forget to signal during lane changes?",
  },
  {
    key: "attention",
    label: "Do you daydream or lose focus while driving?",
  },
  {
    key: "brake",
    label: "Do you brake too hard at times?",
  },
];

const responseOptions = [
  { label: "Never", value: "Never" },
  { label: "Rarely", value: "Rarely" },
  { label: "Sometimes", value: "Sometimes" },
  { label: "Often", value: "Often" },
  { label: "Always", value: "Always" },
];

const riskIndex = {
  Never: 0,
  Rarely: 1,
  Sometimes: 2,
  Often: 3,
  Always: 4,
};

export default function DrivingProfileForm({ onSubmit }) {
  const [form, setForm] = useState({
    daysDriven: "",
    averageDistance: "",
    totalDistance: "",
    averageTime: "",
    licenseDuration: "",
    vehicleType: "",
    heavyTraffic: false,
    harshEvents: false,
  });

  const [dbqResponses, setDbqResponses] = useState({});
  const [checkboxes, setCheckboxes] = useState({
    night: false,
    longTrips: false,
    aggressive: false,
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) => {
    setForm({ ...form, [key]: val });
  };

  const handleSelect = (key, val) => {
    setDbqResponses({ ...dbqResponses, [key]: val });
  };

  const isComplete =
    Object.values(form).every((val) => val !== "") &&
    dbqItems.every((q) => dbqResponses[q.key]);

  const computeScore = () => {
    // Map DBQ responses to numeric values
    const vals = dbqItems.map((q) => riskIndex[dbqResponses[q.key]]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const risk = avg >= 3.5 ? "High" : avg >= 2 ? "Medium" : "Low";

    const days = parseInt(form.daysDriven);
    const totalKm = parseFloat(form.totalDistance);
    const licenseYears = parseInt(form.licenseDuration);

    let drivingLevel = "Bronze";
    if (licenseYears >= 5 && days > 5 && totalKm > 150) {
      drivingLevel = "Gold";
    } else if (licenseYears >= 2 && days >= 3 && totalKm >= 50) {
      drivingLevel = "Silver";
    }

    return {
      averageScore: avg,
      riskLevel: risk,
      drivingLevel,
      ...form,
      ...checkboxes,
    };
  };

  const getScore = () => {
    const licenseYears = parseInt(form.licenseDuration) || 0;
    const days = parseInt(form.daysDriven) || 0;
    const totalKm = parseFloat(form.totalDistance) || 0;
    const behaviorAvg =
      dbqResponses && Object.keys(dbqResponses).length
        ? Object.keys(dbqResponses)
            .map((k) =>
              responseOptions.findIndex((opt) => opt.value === dbqResponses[k])
            )
            .reduce((a, b) => a + b, 0) / Object.keys(dbqResponses).length
        : 0;

    // Scores out of 10
    const licenseScore = Math.min(licenseYears * 2, 10); // Max at 5 years+
    const freqScore = Math.min((days / 7) * 10, 10);
    const distScore =
      totalKm >= 150 ? 10 : totalKm >= 100 ? 7 : totalKm >= 50 ? 5 : 2;
    const behaviorScore = 10 - behaviorAvg * 2; // Lower risky behavior = better
    const contextPenalty = checkboxes.aggressive ? -2 : 0;

    // Weighted total (max 10)
    const total =
      licenseScore * 0.3 +
      freqScore * 0.2 +
      distScore * 0.2 +
      behaviorScore * 0.2 +
      contextPenalty;

    let drivingLevel = "Beginner";
    if (total >= 8) drivingLevel = "Expert";
    else if (total >= 5) drivingLevel = "Intermediate";

    return { totalScore: Math.round(total * 10), drivingLevel };
  };

  const handleSubmit = async () => {
    const riskResult = computeScore();
    const { totalScore, drivingLevel } = getScore();

    setLoading(true);
    try {
      const user = auth.currentUser;
      const profilesRef = collection(db, "drivingProfiles");
      const q = query(profilesRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update existing document
        const docId = snapshot.docs[0].id;
        const docRef = doc(db, "drivingProfiles", docId);
        await updateDoc(docRef, {
          ...riskResult,
          totalScore,
          drivingLevel,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new document
        await addDoc(collection(db, "drivingProfiles"), {
          userId: user.uid,
          ...riskResult,
          totalScore,
          drivingLevel,
          createdAt: new Date().toISOString(),
        });
      }

      // Update user profile
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          drivingLevelEstimation: true,
          drivingLevel,
          riskLevel: riskResult.riskLevel,
          totalScore,
        });
      }

      Alert.alert("Saved!", "Your driving profile was saved successfully.");
      if (onSubmit) onSubmit({ ...riskResult, totalScore, drivingLevel });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Driving Profile & Habits</Text>

        {[
          {
            key: "daysDriven",
            label: "How many days did you drive in the past week?",
          },
          {
            key: "averageDistance",
            label: "What is the average daily distance (km)?",
          },
          {
            key: "totalDistance",
            label: "Total distance driven in past 7 days (km)",
          },
          {
            key: "averageTime",
            label: "Average time per trip (minutes)",
          },
          {
            key: "licenseDuration",
            label: "Years holding a license",
          },
        ].map(({ key, label }) => (
          <TextInput
            key={key}
            label={label}
            value={form[key]}
            onChangeText={(val) => updateForm(key, val)}
            keyboardType="numeric"
            style={styles.input}
          />
        ))}

        <Text style={styles.subheading}>Most Commonly Used Vehicle Type</Text>
        <SegmentedButtons
          value={form.vehicleType}
          onValueChange={(val) => updateForm("vehicleType", val)}
          buttons={[
            { value: "Car", label: "Car" },
            { value: "Motorcycle", label: "Motorcycle" },
            { value: "Truck", label: "Truck" },
            { value: "Van", label: "Van" },
          ]}
        />

        <View style={styles.checkboxRow}>
          <Checkbox
            status={form.heavyTraffic ? "checked" : "unchecked"}
            onPress={() => updateForm("heavyTraffic", !form.heavyTraffic)}
          />
          <Text>Usually drive in heavy traffic?</Text>
        </View>

        <View style={styles.checkboxRow}>
          <Checkbox
            status={form.harshEvents ? "checked" : "unchecked"}
            onPress={() => updateForm("harshEvents", !form.harshEvents)}
          />
          <Text>Often experience harsh braking/acceleration?</Text>
        </View>

        <Text style={styles.subheading}>Driving Behavior</Text>
        {dbqItems.map((q) => (
          <View key={q.key} style={styles.questionBlock}>
            <Text>{q.label}</Text>
            <RadioButton.Group
              value={dbqResponses[q.key]}
              onValueChange={(val) => handleSelect(q.key, val)}
            >
              {responseOptions.map((opt) => (
                <View key={opt.value} style={styles.radioRow}>
                  <RadioButton value={opt.value} />
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        ))}

        <Text style={styles.subheading}>Contextual Factors</Text>
        {["night", "longTrips", "aggressive"].map((k) => (
          <View key={k} style={styles.checkboxRow}>
            <Checkbox
              status={checkboxes[k] ? "checked" : "unchecked"}
              onPress={() =>
                setCheckboxes({ ...checkboxes, [k]: !checkboxes[k] })
              }
            />
            <Text>
              {
                {
                  night: "Drive frequently at night",
                  longTrips: "Often take long trips",
                  aggressive: "Tend to drive aggressively",
                }[k]
              }
            </Text>
          </View>
        ))}

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!isComplete || loading}
          loading={loading}
          style={styles.submit}
        >
          Submit Profile
        </Button>

        {loading && (
          <ActivityIndicator
            animating={true}
            size="large"
            style={{ marginTop: 20 }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  subheading: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 10,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  questionBlock: {
    marginBottom: 15,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  submit: {
    marginTop: 30,
  },
});
