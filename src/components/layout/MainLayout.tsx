import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';

export const MainLayout: React.FC = () => {
  const { activeDocViewerId, openDocumentViewer } = useAuth();
  const navigate = useNavigate();

  const handleAskThisDocument = (docId: string, title: string) => {
    navigate(`/assistant?docId=${docId}&title=${encodeURIComponent(title)}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Document Preview Viewer Modal */}
      {activeDocViewerId && (
        <DocumentViewerModal
          documentId={activeDocViewerId}
          onClose={() => openDocumentViewer(null)}
          onAskThisDocument={handleAskThisDocument}
        />
      )}
    </div>
  );
};
