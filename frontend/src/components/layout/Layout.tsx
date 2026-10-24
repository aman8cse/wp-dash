import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-text-primary flex flex-col transition-colors">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar />
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
