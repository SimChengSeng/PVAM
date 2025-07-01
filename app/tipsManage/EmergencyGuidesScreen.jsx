import React, { useEffect, useState } from "react";
import {
  View,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Card, Text, useTheme, Chip } from "react-native-paper";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

const levelOrder = {
  Beginner: 1,
  Intermediate: 2,
  Expert: 3,
};

export default function EmergencyGuidesScreen({ userLevel = "Beginner" }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const snapshot = await getDocs(collection(db, "emergencyGuides"));
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by driving level priority
        data.sort(
          (a, b) =>
            levelOrder[a.drivingLevel] - levelOrder[b.drivingLevel] ||
            a.category.localeCompare(b.category)
        );

        const uniqueCategories = [...new Set(data.map((tip) => tip.category))];
        setCategories(uniqueCategories);

        // Group by category
        const grouped = data.reduce((acc, tip) => {
          if (!acc[tip.category]) acc[tip.category] = [];
          acc[tip.category].push(tip);
          return acc;
        }, {});

        const sectionsData = Object.keys(grouped).map((category) => ({
          title: category,
          data: grouped[category],
        }));

        setSections(sectionsData);
      } catch (error) {
        console.error("Failed to fetch emergency guides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const filteredSections = selectedCategory
    ? sections.filter((section) => section.title === selectedCategory)
    : sections;

  const renderGuide = ({ item }) => (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      mode="outlined"
    >
      <Card.Title
        title={
          <Text
            style={{
              color: theme.colors.primary,
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {item.title}
          </Text>
        }
        subtitle={
          <Text
            style={{
              color: theme.colors.secondary,
              fontStyle: "italic",
              fontWeight: "bold",
              fontSize: 12,
            }}
          >
            {item.category} • {item.drivingLevel}
          </Text>
        }
      />
      <Card.Content>
        {Array.isArray(item.steps) &&
          item.steps.map((step, idx) => (
            <Text
              key={idx}
              style={{
                marginBottom: 6,
                color: theme.colors.onSurface,
              }}
            >
              {idx + 1}. {step}
            </Text>
          ))}
        <Text
          style={[styles.sourceText, { color: theme.colors.onSurfaceVariant }]}
        >
          Source: {item.source}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        Emergency Guides
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Steps to handle vehicle-related emergencies and contact assistance,
        {"\n"}based on your driving level.
      </Text>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 6,
          paddingHorizontal: 2,
          marginBottom: 14,
          gap: 6,
          maxHeight: 50,
          minHeight: 50,
          alignItems: "center",
        }}
      >
        <Chip
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={{
            marginRight: 6,
            backgroundColor: !selectedCategory
              ? theme.colors.primary
              : theme.colors.surface,
            borderColor: theme.colors.primary,
            borderWidth: 1,
          }}
          textStyle={{
            color: !selectedCategory
              ? theme.colors.onPrimary
              : theme.colors.primary,
            fontWeight: "bold",
          }}
          mode="outlined"
        >
          All
        </Chip>
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={{
              marginRight: 6,
              backgroundColor:
                selectedCategory === cat
                  ? theme.colors.primary
                  : theme.colors.surface,
              borderColor: theme.colors.primary,
              borderWidth: 1,
            }}
            textStyle={{
              color:
                selectedCategory === cat
                  ? theme.colors.onPrimary
                  : theme.colors.primary,
              fontWeight: "bold",
            }}
            mode="outlined"
          >
            {cat}
          </Chip>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator
          animating
          size="large"
          style={styles.loader}
          color={theme.colors.primary}
        />
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={renderGuide}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={[styles.sectionHeader, { color: theme.colors.primary }]}
            >
              {title}
            </Text>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 40,
  },
  list: {
    paddingVertical: 8,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
  },
  loader: {
    marginTop: 60,
  },
  sourceText: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: "italic",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
});
