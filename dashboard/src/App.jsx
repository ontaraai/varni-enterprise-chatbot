import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Escalations from './pages/Escalations';
import Products from './pages/Products';

function MobileHeader() {
  const { toggle } = useSidebar();
  const location = useLocation();

  const pageNames = {
    '/': 'Dashboard',
    '/conversations': 'Conversations',
    '/escalations': 'Escalations',
    '/products': 'Products',
  };

  return (
    <header className="mobile-header">
      <button className="mobile-header__toggle" onClick={toggle} aria-label="Toggle menu">
        <Menu size={20} />
      </button>
      <span className="mobile-header__title">{pageNames[location.pathname] || 'Varni'}</span>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <MobileHeader />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/products" element={<Products />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppLayout />
      </SidebarProvider>
    </BrowserRouter>
  );
}
