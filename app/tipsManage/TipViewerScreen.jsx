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

const TipViewerScreen = ({ userLevel = "Beginner" }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const snapshot = await getDocs(collection(db, "maintenanceTips"));
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort tips by level priority
        data.sort(
          (a, b) =>
            levelOrder[a.drivingLevel] - levelOrder[b.drivingLevel] ||
            a.category.localeCompare(b.category)
        );

        // Get unique categories
        const uniqueCategories = [...new Set(data.map((tip) => tip.category))];
        setCategories(uniqueCategories);

        // Group by category
        const grouped = data.reduce((acc, tip) => {
          if (!acc[tip.category]) acc[tip.category] = [];
          acc[tip.category].push(tip);
          return acc;
        }, {});

        // Convert to SectionList format
        const sectionsData = Object.keys(grouped).map((category) => ({
          title: category,
          data: grouped[category],
        }));

        setSections(sectionsData);
      } catch (error) {
        console.error("Failed to fetch tips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, []);

  // Filter sections by selectedCategory
  const filteredSections = selectedCategory
    ? sections.filter((section) => section.title === selectedCategory)
    : sections;

  const renderTip = ({ item }) => (
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
        <Text style={{ color: theme.colors.onSurface }}>
          s
          {Array.isArray(item.content)
            ? item.content.join("\n\n")
            : item.content}
        </Text>
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
        Tips
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Tips for vehicle maintenance and safe driving, {"\n"}
        tailored to your experience level.
      </Text>
      {/* Category filter chips */}
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
        style={{ marginBottom: 4 }}
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
          renderItem={renderTip}
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
};

export default TipViewerScreen;

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
