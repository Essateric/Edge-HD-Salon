import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AppHeader from "@/components/AppHeader";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ServicesPage from "@/pages/ServicesPage";
import CalendarView from "@/pages/CalendarView";
import AppointmentsDashboard from "@/pages/AppointmentsDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={CalendarView} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/appointments" component={AppointmentsDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden">
        <AppHeader />
        <main className="flex-1 h-[calc(100%-64px)] overflow-hidden">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
