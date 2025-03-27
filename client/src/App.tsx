import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AppHeader from "@/components/AppHeader";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ServicesPage from "@/pages/ServicesPage";
import CalendarView from "@/pages/CalendarView";
import AppointmentsDashboard from "@/pages/AppointmentsDashboard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

function Router() {
  const [location] = useLocation();
  const isAuthRoute = location === '/login' || location === '/register';

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={CalendarView} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/appointments" component={AppointmentsDashboard} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthRoute = location === '/login' || location === '/register';

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
