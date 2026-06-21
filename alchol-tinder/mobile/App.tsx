import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import IncomingCallModal from './src/components/IncomingCallModal';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { IncomingCallProvider } from './src/context/IncomingCallContext';
import { navigationRef } from './src/navigation/navigationRef';
import { AppStackParamList, AuthStackParamList } from './src/navigation/types';
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';
import ChatScreen from './src/screens/ChatScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import LoginScreen from './src/screens/LoginScreen';
import MatchScreen from './src/screens/MatchScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import TagSelectionScreen from './src/screens/TagSelectionScreen';
import VirtualCheersScreen from './src/screens/VirtualCheersScreen';
import { colors } from './src/theme/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.backgroundAlt,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.backgroundAlt },
  headerTintColor: colors.textPrimary,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Login" screenOptions={screenOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign up' }} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { profile } = useAuth();
  const initialRouteName = !profile || profile.tags.length === 0 ? 'TagSelection' : 'Discover';

  return (
    <AppStack.Navigator initialRouteName={initialRouteName} screenOptions={screenOptions}>
      <AppStack.Screen
        name="TagSelection"
        component={TagSelectionScreen}
        options={{ title: 'Pick your vibe' }}
      />
      <AppStack.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Nearby' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Your profile' }} />
      <AppStack.Screen name="Matches" component={MatchesScreen} options={{ title: 'Your matches' }} />
      <AppStack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ title: 'Blocked users' }}
      />
      <AppStack.Screen name="Match" component={MatchScreen} options={{ title: 'Match' }} />
      <AppStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.match.other_user.display_name })}
      />
      <AppStack.Screen
        name="VirtualCheers"
        component={VirtualCheersScreen}
        options={{ title: 'Virtual cheers', headerShown: false }}
      />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return token ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <IncomingCallProvider>
        <NavigationContainer ref={navigationRef} theme={navigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
        <IncomingCallModal />
      </IncomingCallProvider>
    </AuthProvider>
  );
}
