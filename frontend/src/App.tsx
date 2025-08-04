
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ForgotPasswordForm, LoginForm, ProtectedRoute, RegisterForm } from './components/auth';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthProvider } from './contexts/AuthContext';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div style={{ minHeight: '100vh' }}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={
                <div style={{ 
                  minHeight: '100vh', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '3rem 1rem'
                }}>
                  <LoginForm />
                </div>
              } />
              <Route path="/register" element={
                <div style={{ 
                  minHeight: '100vh', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '3rem 1rem'
                }}>
                  <RegisterForm />
                </div>
              } />
              <Route path="/forgot-password" element={
                <div style={{ 
                  minHeight: '100vh', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '3rem 1rem'
                }}>
                  <ForgotPasswordForm />
                </div>
              } />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App
