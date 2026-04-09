import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Chatbot from './components/Chatbot';
import { ToastProvider } from './components/Toast';
import { WebSocketProvider } from './contexts/WebSocketContext';

const App = () => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    setShowDetail(true);
  };

  const handleBack = () => {
    setShowDetail(false);
    setSelectedEmail(null);
  };

  const handleFilterChange = (filter) => {
    setFilterBy(filter);
    setShowDetail(false);
    setSelectedEmail(null);
  };

  const handleEmailUploaded = () => {
    setShowDetail(false);
    setSelectedEmail(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <WebSocketProvider>
      <ToastProvider>
        <div className={darkMode ? 'dark-mode' : ''} style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-primary)'
        }}>
          <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} darkMode={darkMode} toggleTheme={toggleTheme} />

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Sidebar onEmailUploaded={handleEmailUploaded} filterBy={filterBy} onFilterChange={handleFilterChange} />

            <main style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '8px' }}>
              {showDetail ? (
                <EmailDetail email={selectedEmail} onBack={handleBack} />
              ) : (
                <EmailList
                  onSelectEmail={handleSelectEmail}
                  selectedEmail={selectedEmail}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterBy={filterBy}
                  refreshTrigger={refreshTrigger}
                />
              )}
            </main>
          </div>

          {/* Global Chatbot - Always Visible */}
          <Chatbot email={selectedEmail} />
        </div>
      </ToastProvider>
    </WebSocketProvider>
  );
};

export default App;
