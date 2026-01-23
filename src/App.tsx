import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import DietForm from "./pages/DietForm";
import DietResult from "./pages/DietResult";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RecoverPassword from "./pages/RecoverPassword";
import ResetPassword from "./pages/ResetPassword";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecoverPassword />} />
            <Route path="/nova-senha" element={<ResetPassword />} />
            <Route path="/acesso-negado" element={<AccessDenied />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            } />
            <Route path="/criar-dieta" element={
              <ProtectedRoute>
                <DietForm />
              </ProtectedRoute>
            } />
            <Route path="/resultado" element={
              <ProtectedRoute>
                <DietResult />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;