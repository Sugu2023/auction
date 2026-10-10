import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { RequireAuth } from './components/RequireAuth';
import { AuctionProvider } from './context/AuctionContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { TeamPage } from './pages/TeamPage';
import { AuctionPage } from './pages/admin/AuctionPage';
import { PlayersPage } from './pages/admin/PlayersPage';
import { SetupPage } from './pages/admin/SetupPage';
import { SquadsPage } from './pages/admin/SquadsPage';
import { StartAuctionPage } from './pages/admin/StartAuctionPage';
import { TeamsPage } from './pages/admin/TeamsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <RequireAuth role="admin">
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="setup" replace />} />
              <Route path="setup" element={<SetupPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="start" element={<StartAuctionPage />} />
              <Route path="auction" element={<AuctionPage />} />
              <Route path="squads" element={<SquadsPage />} />
            </Route>

            <Route
              path="/team"
              element={
                <RequireAuth role="team">
                  <TeamPage />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
