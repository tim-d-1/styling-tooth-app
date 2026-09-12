import { useEffect, useState } from "react";
import Header from "./components/Header";
import LocationBar from "./components/LocationBar";
import VisitSection, { type VisitData } from "./components/VisitSection";
import PromoBannersGrid from "./components/PromoBannersGrid";
import ExpertAdviceGrid, {
  type ArticleItem,
} from "./components/ExpertAdviceGrid";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import { supabase } from "./lib/supabase";

const EXPERT_ARTICLES: ArticleItem[] = [
  {
    id: "shampoo-guide",
    title: "ЯК ОБРАТИ ПРАВИЛЬНИЙ ШАМПУНЬ?",
    bgImage: "/assets/images/golden_retriever_bath.png",
    bgColor: "var(--color-soft-ice)",
    type: "shampoo",
  },
  {
    id: "paws-tips",
    title: "5 ПОРАД",
    subtitle: "для здорових лап",
    bgImage: "/assets/images/dog_paw_close_up.png",
    bgColor: "var(--color-soft-blue)",
    type: "paw",
  },
  {
    id: "post-walk-care",
    title: "Як доглядати за шерстю після прогулянок?",
    bgImage: "/assets/images/expert_advice_dog_walk-51ea98.png",
    logo: "/assets/images/expert_advice_logo.png",
    type: "walk",
  },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<"landing" | "main" | "login">("landing");
  const [visit] = useState<VisitData | null>(null);
  const [activeNav, setActiveNav] = useState("home");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authed = Boolean(session?.user);
      setIsLoggedIn(authed);
      if (authed) {
        setCurrentView("main");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = Boolean(session?.user);
      setIsLoggedIn(authed);
      if (authed) {
        setCurrentView("main");
      }
    });

    const handleHashChange = () => {
      if (
        window.location.hash === "#login" ||
        window.location.pathname === "/login"
      ) {
        setCurrentView("login");
      } else if (
        window.location.hash === "#main" ||
        window.location.pathname === "/main"
      ) {
        setCurrentView("main");
      } else if (
        window.location.hash === "#landing" ||
        window.location.pathname === "/landing"
      ) {
        setCurrentView("landing");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  const navigateToLogin = () => {
    setCurrentView("login");
    if (window.location.hash !== "#login") {
      window.location.hash = "login";
    }
  };

  const navigateToMain = () => {
    setCurrentView("main");
    if (window.location.hash === "#login" || window.location.hash === "#landing") {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  if (currentView === "login") {
    return (
      <LoginPage
        onBack={navigateToMain}
        onSuccess={() => {
          setIsLoggedIn(true);
          navigateToMain();
          showToast("Успішний вхід у систему");
        }}
        onNavigateRegister={() => {}}
      />
    );
  }

  if (!isLoggedIn || currentView === "landing") {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[9999] bg-content-dark text-white px-5 py-3.5 rounded-xl shadow-2xl text-sm font-primary animate-fade-in">
            {toastMessage}
          </div>
        )}
        <LandingPage
          onLoginClick={navigateToLogin}
          onRegisterClick={navigateToLogin}
          onBookClick={() => {
            if (isLoggedIn) {
              navigateToMain();
            } else {
              showToast("Увійдіть для запису на візит");
              navigateToLogin();
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-content-dark text-white px-5 py-3.5 rounded-xl shadow-2xl text-sm font-primary animate-fade-in">
          {toastMessage}
        </div>
      )}

      <Header
        isLoggedIn={isLoggedIn}
        activeNav={activeNav}
        onLoginClick={navigateToLogin}
        onNavClick={(nav) => {
          setActiveNav(nav);
        }}
        onDeviceClick={() => showToast("")}
        onProfileClick={() => showToast("")}
      />

      <LocationBar
        location="м. Запоріжжя"
        hasNotification={false}
        onNotificationClick={() => showToast("")}
      />

      <VisitSection
        visit={visit}
        onBookClick={() => showToast("")}
        onReschedule={() => showToast("")}
        onCancel={() => showToast("")}
      />

      <PromoBannersGrid
        onBanner1Click={() => showToast("")}
        onBanner2Click={() => showToast("")}
        onBanner3Click={() => showToast("")}
      />

      <ExpertAdviceGrid
        articles={EXPERT_ARTICLES}
        onArticleClick={(articleId) =>
          showToast(`Відкрито статтю: ${articleId}`)
        }
      />
    </div>
  );
}
