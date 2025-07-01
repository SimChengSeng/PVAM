import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/1_index" />;
  // return <Redirect href="/(auth)/welcome" />;
}
