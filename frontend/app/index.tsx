import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth - the _layout will handle auth protection
  return <Redirect href="/(auth)/login" />;
}

