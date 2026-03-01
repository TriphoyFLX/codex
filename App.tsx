// App.tsx (исправленная версия)
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import AuthForm from "./pages/auth/Auth";
import Sidebar from "./components/Sidebar";
import CoursesSection from "./pages/coursesSection/CoursesSection";
import Practice from "./pages/practice/Practice";
import AiAssistant from "./pages/ai/AiAssistant";
import EnhancedLeaderboard from "./pages/leaderboard/EnhancedLeaderboard";
import Posts from "./pages/posts/Posts";
import Profile from "./pages/profile/Profile";
import { ProfileProvider } from "./context/ProfileContext";
import { ProgressProvider } from "./context/ProgressContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import Home from "./pages/home/Home";
import Header from "./components/Header";
import CourseDetail from "./pages/coursesSection/CourseDetail";
import CourseContentManager from "./pages/coursesSection/CourseContentManager";
import CourseViewer from "./pages/coursesSection/CourseViewer";
import SearchPage from "./pages/searchPage/SearchPage";
import PublicProfile from "./pages/publicProfile/PublicProfile";
import CreateProfile from "./pages/createProfile/CreateProfile";
import AuthCallback from "./auth/AuthCallback";
import styles from "./App.module.css";
import BusinessGame from "./pages/practice/BusinessGame";
import ProtectedRoute from "./components/ProtectedRoute";
import SelectSchoolPage from "./pages/SelectSchoolPage/SelectSchoolPage";
import LoadingScreen from "./components/common/LoadingScreen";
import { useProfile } from "./context/ProfileContext";
import AdminApplications from './pages/coursesSection/AdminApplications';
import TestsManagement from './pages/tests/TestsManagement';
import StudentTests from './pages/tests/StudentTests';
import TestResults from './pages/tests/TestResults';
import Tasks from './pages/tasks/Tasks';
import ScheduleManager from './pages/schedule/ScheduleManager';
import ScheduleView from './pages/schedule/ScheduleView';
import AdminPanel from './pages/admin/AdminPanel';
import AdminRoute from './components/AdminRoute';

const MOBILE_BREAKPOINT = 768;

function AppContentWithSidebar() {
  const location = useLocation();
  const { profile, loading } = useProfile();
  const { isSidebarCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const user = profile ? { id: profile.id } : null;
  const isAuthPage = ['/login', '/register', '/auth/callback'].includes(location.pathname);
  const isCreateProfilePage = location.pathname === '/create-profile';
  const isSelectSchoolPage = location.pathname === '/select-school';
  const needsOnboarding = !!profile && profile.school_id && !profile.onboarding_completed;

  // Дополнительная проверка - если профиль еще не загружен полностью
  if (!loading && profile && !profile.school_id && location.pathname !== '/select-school' && !isAuthPage && !isCreateProfilePage && location.pathname !== '/tests/manage' && location.pathname !== '/tests') {
    return <Navigate to="/select-school" replace />;
  }

  // If school is selected but onboarding is not completed, force profile completion
  if (!loading && needsOnboarding && location.pathname !== '/create-profile' && !isAuthPage && location.pathname !== '/tests/manage' && location.pathname !== '/tests') {
    return <Navigate to="/create-profile" replace />;
  }
  
  // Проверка авторизации
  if (!user && !isAuthPage && !isCreateProfilePage && !isSelectSchoolPage) {
    return <Navigate to="/login" replace />;
  }

  if (user && isAuthPage) {
    return <Navigate to="/create-profile" replace />;
  }

  if (!user && (isCreateProfilePage || isSelectSchoolPage)) {
    return <Navigate to="/login" replace />;
  }

  // Определяем показывать ли сайдбар и хедер
  const hasSchool = profile?.school_id;
  const showSidebarAndHeader = user && profile && hasSchool && !isCreateProfilePage && !isSelectSchoolPage;
  const showHeader = location.pathname !== "/ai-assistant";

  // Функция для защищенных маршрутов
  const ProtectedElement = (Component: React.ComponentType) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return <Navigate to="/create-profile" replace />;
    if (!profile.school_id) return <Navigate to="/select-school" replace />;
    if (!profile.onboarding_completed) return <Navigate to="/create-profile" replace />;
    return <Component />;
  };

  return (
    <div className={styles.appContainer}>
      {showSidebarAndHeader && <Sidebar />}
      
      <div
        className={`${styles.content} ${
          isMobile ? styles.contentMobile : 
          showSidebarAndHeader ? (isSidebarCollapsed ? styles.contentCollapsed : styles.contentDesktop) : styles.noSidebar
        }`}
      >
        {showSidebarAndHeader && showHeader && <Header />}
        
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<AuthForm />} />
          <Route path="/register" element={<AuthForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Маршрут создания профиля */}
          <Route path="/create-profile" element={
            !user ? <Navigate to="/login" replace /> : 
            profile && profile.onboarding_completed ? <Navigate to="/" replace /> :
            <CreateProfile />
          } />
          
          {/* Маршрут выбора школы */}
          <Route path="/select-school" element={
            !user ? <Navigate to="/login" replace /> :
            !profile ? <Navigate to="/create-profile" replace /> :
            profile?.school_id ? (
              profile.onboarding_completed ? <Navigate to="/" replace /> : <Navigate to="/create-profile" replace />
            ) :
            <SelectSchoolPage />
          } />
          
          {/* Защищенные маршруты (требуют профиль и школу) */}
          <Route path="/" element={ProtectedElement(Home)} />
          <Route path="/courses" element={ProtectedElement(CoursesSection)} />
          <Route path="/admin/applications" element={
            <ProtectedRoute requireTeacher>
              <AdminApplications />
            </ProtectedRoute>
          } />
          
          <Route path="/course/:id" element={ProtectedElement(CourseDetail)} />
          <Route path="/course/:id/content" element={
            <ProtectedRoute requireTeacher>
              <CourseContentManager />
            </ProtectedRoute>
          } />
          <Route path="/course/:id/view" element={ProtectedElement(CourseViewer)} />
          <Route path="/practice" element={ProtectedElement(Practice)} />
          <Route path="/tasks" element={ProtectedElement(Tasks)} />
          <Route path="/tests" element={ProtectedElement(StudentTests)} />
          <Route path="/tests/results" element={ProtectedElement(TestResults)} />
          <Route path="/tests/manage" element={
            <ProtectedRoute requireTeacher>
              <TestsManagement />
            </ProtectedRoute>
          } />
          <Route path="/schedule/manage" element={
            <ProtectedRoute requireTeacher>
              <ScheduleManager />
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={ProtectedElement(ScheduleView)} />
          <Route path="/ai-assistant" element={ProtectedElement(AiAssistant)} />
          <Route path="/leaderboard" element={ProtectedElement(EnhancedLeaderboard)} />
          <Route path="/posts" element={ProtectedElement(Posts)} />
          <Route path="/profile" element={ProtectedElement(Profile)} />
          
          <Route path="/profile/:userId" element={
            !user ? <Navigate to="/login" replace /> :
            !profile ? <Navigate to="/create-profile" replace /> :
            !profile.school_id ? <Navigate to="/select-school" replace /> :
            <PublicProfile />
          } />
          
          
          <Route path="/search" element={ProtectedElement(SearchPage)} />
          
          {/* Маршруты для BusinessGame (тесты) */}
          <Route path="/business-game" element={ProtectedElement(BusinessGame)} />
          <Route path="/quiz/:quizId" element={ProtectedElement(BusinessGame)} />
          
          {/* Админ панель */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
          
          {/* Резервный редирект */}
          <Route path="*" element={
            <Navigate to={user ? 
              (profile ? 
                (profile.school_id ? "/" : "/select-school") 
                : "/create-profile") 
              : "/login"} 
            replace />
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ProfileProvider>
      <ProgressProvider>
        <SidebarProvider>
          <BrowserRouter>
            <AppContentWithSidebar />
          </BrowserRouter>
        </SidebarProvider>
      </ProgressProvider>
    </ProfileProvider>
  );
}

export default App;