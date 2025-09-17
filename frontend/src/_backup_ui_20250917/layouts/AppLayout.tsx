import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Toasts } from '../components/Toasts';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  currentSection: string;
  onNavigate: (path: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPath,
  currentSection,
  onNavigate
}) => {
  return (
    <>
      {/* Use our new professional Layout system */}
      <Layout 
        currentSection={currentSection}
        currentPath={currentPath}
        onNavigate={onNavigate}
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </Layout>

      {/* Toasts */}
      <Toasts />
    </>
  );
};
