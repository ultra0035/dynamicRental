import React, { useState, useEffect } from 'react';
import { ActiveTab, RiderApplication, BikeCondition, Bike } from './types';
import { COMPANY_DETAILS, BIKES } from './data/bikes';
import { INITIAL_APPLICATIONS } from './data/initialApplications';
import { Header } from './components/Header';
import { BikeCatalog } from './components/BikeCatalog';
import { ApplicationForm } from './components/ApplicationForm';
import { StatusTracker } from './components/StatusTracker';
import { AdminPortal } from './components/AdminPortal';
import { LocationCard } from './components/LocationCard';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { GitHubExportModal } from './components/GitHubExportModal';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import {
  fetchApplications,
  saveApplicationToDb,
  fetchBikes,
  saveBikeToDb,
  deleteBikeFromDb,
} from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apply');
  const [applications, setApplications] = useState<RiderApplication[]>(INITIAL_APPLICATIONS);
  const [bikes, setBikes] = useState<Bike[]>(BIKES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);

  // Selected bike prefill for application form
  const [selectedBikeForApp, setSelectedBikeForApp] = useState<{
    bikeId: string;
    condition: BikeCondition;
    termMonths: number;
  }>({
    bikeId: 'bajaj-boxer-150',
    condition: 'new',
    termMonths: 18,
  });

  // Status search prefill
  const [statusSearchQuery, setStatusSearchQuery] = useState<string>('');

  // Initial Load from Supabase (with fallback to local repository)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [loadedApps, loadedBikes] = await Promise.all([
          fetchApplications(),
          fetchBikes(),
        ]);
        if (loadedApps && loadedApps.length > 0) {
          setApplications(loadedApps);
        }
        if (loadedBikes && loadedBikes.length > 0) {
          setBikes(loadedBikes);
        }
      } catch (err) {
        console.warn('Could not load from remote database, using cached data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSelectBikeForApplication = (bikeId: string, condition: BikeCondition, termMonths: number) => {
    setSelectedBikeForApp({ bikeId, condition, termMonths });
    setActiveTab('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplicationSubmitted = async (newApp: RiderApplication) => {
    setApplications((prev) => [newApp, ...prev]);
    try {
      await saveApplicationToDb(newApp);
    } catch (e) {
      console.warn('Background sync error:', e);
    }
  };

  const handleUpdateApplication = async (updated: RiderApplication) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updated.id ? updated : app))
    );
    try {
      await saveApplicationToDb(updated);
    } catch (e) {
      console.warn('Background sync error:', e);
    }
  };

  const handleSaveBike = async (bike: Bike) => {
    setBikes((prev) => {
      const exists = prev.some((b) => b.id === bike.id);
      if (exists) {
        return prev.map((b) => (b.id === bike.id ? bike : b));
      }
      return [bike, ...prev];
    });
    try {
      await saveBikeToDb(bike);
    } catch (e) {
      console.warn('Background save bike error:', e);
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
    try {
      await deleteBikeFromDb(bikeId);
    } catch (e) {
      console.warn('Background delete bike error:', e);
    }
  };

  const handleViewStatus = (refNumber: string) => {
    setStatusSearchQuery(refNumber);
    setActiveTab('status');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewWalkin = () => {
    setActiveTab('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminFromFooter = () => {
    if (isAdminLoggedIn) {
      setActiveTab('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setShowAdminLoginModal(false);
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingCount = applications.filter((a) => a.status === 'pending_review').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Global Navigation Header: Bikes & Pricing, Apply Now, Track Status */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-16">
        {activeTab === 'apply' && (
          <ApplicationForm
            bikes={bikes}
            initialBikeId={selectedBikeForApp.bikeId}
            initialCondition={selectedBikeForApp.condition}
            initialTerm={selectedBikeForApp.termMonths}
            onApplicationSubmitted={handleApplicationSubmitted}
            onViewStatus={handleViewStatus}
          />
        )}

        {activeTab === 'fleet' && (
          <BikeCatalog
            bikes={bikes}
            onSelectBikeForApplication={handleSelectBikeForApplication}
          />
        )}

        {activeTab === 'status' && (
          <StatusTracker
            applications={applications}
            initialSearchQuery={statusSearchQuery}
            onApplyNew={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            applications={applications}
            bikes={bikes}
            onUpdateApplication={handleUpdateApplication}
            onSaveBike={handleSaveBike}
            onDeleteBike={handleDeleteBike}
            onAddNewWalkin={handleAddNewWalkin}
            onCloseAdmin={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'location' && (
          <LocationCard
            onApplyNow={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Floating WhatsApp Contact Button */}
      <WhatsAppFloatingButton />

      {/* App Footer with Admin Login & GitHub Loader */}
      <Footer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdminLogin={handleOpenAdminFromFooter}
        onOpenGitHubModal={() => setShowGitHubModal(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Admin Login Modal (Triggered from Footer) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* GitHub Export / Publish Guide Modal */}
      <GitHubExportModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />
    </div>
  );
}
