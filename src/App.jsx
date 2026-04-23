import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AddExpense from "./pages/AddExpense";
import BudgetManagement from "./pages/BudgetManagement";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";

function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState("login");
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    localStorage.removeItem("um_pin");
  }, []);

  const navigate = (target, payload = null) => {
    setSelectedExpense(payload);
    setPage(target);
  };

  if (!user) {
    if (page === "register") return <Register onNavigate={navigate} />;
    return <Login onNavigate={navigate} />;
  }

  const content = () => {
    switch (page) {
      case "dashboard":
      case "home":
        return <Home onNavigate={navigate} />;
      case "history":
        return <History />;
      case "add-expense":
        return <AddExpense onNavigate={navigate} editExpense={selectedExpense} />;
      case "budget":
        return <BudgetManagement />;
      case "reports":
        return <Reports />;
      case "notifications":
        return <Notifications />;
      case "settings":
        return <Settings />;
      case "profile":
        return <Profile />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return <Layout currentPage={page} onNavigate={navigate}>{content()}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  );
}
