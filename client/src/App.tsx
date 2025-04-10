import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AppHeader from "@/components/AppHeader";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ServicesPage from "@/pages/ServicesPage";
import AppointmentsDashboard from "@/pages/AppointmentsDashboard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import UserManagement from "@/pages/UserManagement";
import FullCalendarPreview from "@/pages/FullCalendarPreview";
import { useEffect, useState } from "react";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setLocation('/login');
        }
      } catch (error) {
        setIsAuthenticated(false);
        setLocation('/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/login" />;
}

function Router() {
  const [location] = useLocation();
  const isAuthRoute = location === '/login' || location === '/register' || location === '/public-calendar';

  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/calendar-preview" component={() => <ProtectedRoute component={FullCalendarPreview} />} />
      <Route path="/services" component={() => <ProtectedRoute component={ServicesPage} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={AppointmentsDashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UserManagement} />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      {/* Public calendar view for testing */}
      <Route path="/public-calendar" component={FullCalendarPreview} />
      {/* Redirect old calendar route to new calendar */}
      <Route path="/calendar">
        <Redirect to="/calendar-preview" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const isAuthRoute = location === '/login' || location === '/register' || location === '/public-calendar';

  // Redirect to calendar view by default
  useEffect(() => {
    if (location === '/') {
      setLocation('/calendar-preview');
    }
  }, [location, setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden">
        {!isAuthRoute && <AppHeader />}
        <main className={`flex-1 ${!isAuthRoute ? 'h-[calc(100%-64px)]' : 'h-full'} overflow-hidden`}>
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
