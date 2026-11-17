import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button, HelperText, Text, useTheme } from 'react-native-paper';

WebBrowser.maybeCompleteAuthSession();

const clientId = process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID ?? '';
const tenantDomain = process.env.EXPO_PUBLIC_ENTRA_TENANT_DOMAIN ?? '';
const tenantId = process.env.EXPO_PUBLIC_ENTRA_TENANT_ID ?? '';
const userFlow = process.env.EXPO_PUBLIC_ENTRA_USER_FLOW ?? '';
const apiScope = process.env.EXPO_PUBLIC_ENTRA_API_SCOPE ?? '';
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const authority = tenantDomain && tenantId ? `https://${tenantDomain}/${tenantId}` : '';
const policy = encodeURIComponent(userFlow);

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `${authority}/oauth2/v2.0/authorize?p=${policy}`,
  tokenEndpoint: `${authority}/oauth2/v2.0/token?p=${policy}`,
};

type Props = {
  onLogin: (accessToken: string) => void;
};

export default function LoginScreen({ onLogin }: Props) {
  const theme = useTheme();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'ferrechido', path: 'redirect' });
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', apiScope].filter(Boolean),
      usePKCE: true,
    },
    discovery
  );
  const [errorGeneral, setErrorGeneral] = useState('');
  const [cargando, setCargando] = useState(false);

  const configuracionCompleta = Boolean(clientId && authority && userFlow && apiScope && apiUrl);

  const ingresar = async () => {
    setErrorGeneral('');
    if (!request) return;

    setCargando(true);
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      if (result.type === 'error') {
        throw new Error(result.error?.message ?? 'No se pudo completar el inicio de sesión.');
      }
      if (result.type !== 'success') {
        throw new Error('No se recibió una respuesta de autenticación válida.');
      }
      if (!request.codeVerifier) {
        throw new Error('Falta el verificador PKCE. Intenta iniciar sesión de nuevo.');
      }

      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: result.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery
      );
      if (!tokens.accessToken) {
        throw new Error('El proveedor de inicio de sesión no devolvió un token para acceder a la API.');
      }
      onLogin(tokens.accessToken);
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'Error de autenticación desconocido.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.pantalla, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.encabezado}>
          <View style={[styles.logo, { borderColor: theme.colors.outline }]}>
            <Text variant="headlineMedium" style={styles.logoLetra}>
              F
            </Text>
          </View>
          <Text variant="displaySmall" style={styles.marca}>
            FERRECHIDO
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Control de inventario
          </Text>
        </View>

        <HelperText type="error" visible={errorGeneral !== ''} style={styles.errorGeneral}>
          {errorGeneral}
        </HelperText>

        <Button
          mode="contained"
          onPress={ingresar}
          loading={cargando}
          disabled={cargando || !configuracionCompleta || !request}
          contentStyle={styles.botonContenido}
        >
          INICIAR SESIÓN CON CORREO Y CONTRASEÑA
        </Button>

        <Text variant="bodySmall" style={[styles.pista, { color: theme.colors.onSurfaceVariant }]}>
          Inicia con tu cuenta local. El registro y la recuperación de contraseña se administran en el portal seguro de acceso.
        </Text>
        <HelperText type="error" visible={!configuracionCompleta}>
          Configura las variables EXPO_PUBLIC_ENTRA_* y EXPO_PUBLIC_API_URL en .env.
        </HelperText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  encabezado: { alignItems: 'center', marginBottom: 32, gap: 4 },
  logo: { width: 64, height: 64, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoLetra: { fontWeight: '800' },
  marca: { fontWeight: '800', letterSpacing: 4 },
  errorGeneral: { marginBottom: 12 },
  botonContenido: { paddingVertical: 6 },
  pista: { textAlign: 'center', marginTop: 24 },
});
