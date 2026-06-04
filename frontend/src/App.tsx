import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { ActivityPage } from "./pages/ActivityPage";
import { DiaryPage } from "./pages/DiaryPage";
import { HomePage } from "./pages/HomePage";
import { ListDetailPage } from "./pages/ListDetailPage";
import { ListsPage } from "./pages/ListsPage";
import { LoginPage } from "./pages/LoginPage";
import { MediaDetailPage } from "./pages/MediaDetailPage";
import { PopularPage } from "./pages/PopularPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/popular/:type" element={<PopularPage />} />
            <Route path="/media/:type/:id" element={<MediaDetailPage />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/u/:username/diary" element={<DiaryPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/lists/:id" element={<ListDetailPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/feed" element={<ActivityPage followedOnly />} />
              <Route path="/lists" element={<ListsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);
