import { useEffect } from "react";
import {
  Switch,
  Route,
  Router as WouterRouter,
  useLocation,
} from "wouter";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Editorials from "@/pages/editorials/index";
import EditorialDetail from "@/pages/editorials/[id]";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/index";
import AdminArticleNew from "@/pages/admin/articles/new";
import AdminArticleEdit from "@/pages/admin/articles/[id]/edit";

import Privacy from "@/pages/privacy";

import {
  initAnalytics,
  trackPageView,
} from "@/lib/analytics";

const queryClient = new QueryClient();

function AnalyticsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location);
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/editorials" component={Editorials} />
      <Route path="/editorials/:id" component={EditorialDetail} />

      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articles/new" component={AdminArticleNew} />
      <Route path="/admin/articles/:id/edit" component={AdminArticleEdit} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AnalyticsTracker />
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
