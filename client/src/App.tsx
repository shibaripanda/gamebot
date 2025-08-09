import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { HashRouter, Route, Routes } from "react-router-dom";
import { StartPage } from "./pages/startPage/StartPage";
import { DashboardPage } from "./pages/dashboardPage/DashboardPage";

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  );
}
