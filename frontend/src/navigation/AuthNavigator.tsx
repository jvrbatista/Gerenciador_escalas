import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { CriarOrganizacaoScreen } from '@/screens/auth/CriarOrganizacaoScreen';
import { EntrarOrganizacaoScreen } from '@/screens/auth/EntrarOrganizacaoScreen';
import { EsqueciSenhaScreen } from '@/screens/auth/EsqueciSenhaScreen';
import { RedefinirSenhaScreen } from '@/screens/auth/RedefinirSenhaScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  CriarOrganizacao: undefined;
  EntrarOrganizacao: undefined;
  EsqueciSenha: undefined;
  RedefinirSenha: { token?: string } | undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CriarOrganizacao" component={CriarOrganizacaoScreen} />
      <Stack.Screen name="EntrarOrganizacao" component={EntrarOrganizacaoScreen} />
      <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
      <Stack.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} />
    </Stack.Navigator>
  );
}
