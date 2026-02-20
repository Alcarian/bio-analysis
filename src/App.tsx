import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Home from "./pages/Home";
import { ThemeModeProvider, useThemeMode } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PdfPasswordProvider } from "./contexts/PdfPasswordContext";
import { lightTheme, darkTheme } from "./theme/themes";
import LockScreen from "./components/LockScreen";
import InstallPromptBanner from "./components/InstallPromptBanner";
import UpdateBanner from "./components/UpdateBanner";

function AuthGate() {
  const { status } = useAuth();

  if (status === "loading" || status === "no-pin" || status === "locked") {
    return <LockScreen />;
  }

  return <Home />;
}

function ThemedApp() {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
      <CssBaseline />
      <InstallPromptBanner />
      <UpdateBanner />
      <AuthGate />
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <PdfPasswordProvider>
        <ThemeModeProvider>
          <ThemedApp />
        </ThemeModeProvider>
      </PdfPasswordProvider>
    </AuthProvider>
  );
}

export default App;
