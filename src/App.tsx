import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { useTaskStore, useUserStore } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/Tasks/TaskDetail';
import NewTask from './pages/Tasks/NewTask';
import Monitor from './pages/Monitor';
import Warnings from './pages/Warnings';
import Strategy from './pages/Strategy';
import Reports from './pages/Reports';
import Approvals from './pages/Approvals';
import Performance from './pages/Performance';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RedirectToDashboard() {
  return <Navigate to="/dashboard" replace />;
}

function MonitorWrapper() {
  const { tasks } = useTaskStore();
  const firstTask = tasks[0];
  
  if (firstTask) {
    return <Navigate to={`/monitor/${firstTask.id}`} replace />;
  }
  
  return (
    <div className="flex items-center justify-center h-96 text-slate-400">
      暂无任务，请先创建模拟任务
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RedirectToDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Tasks />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/tasks/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <NewTask />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TaskDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/monitor"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MonitorWrapper />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/monitor/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Monitor />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/warnings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Warnings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/strategy"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Strategy />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/strategy/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Strategy />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Approvals />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Performance />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
