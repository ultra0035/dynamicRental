import React, { useState, useEffect } from 'react';
import { ActiveTab, RiderApplication, BikeCondition, Bike } from './types';
import { COMPANY_DETAILS, BIKES } from './data/bikes';
import { INITIAL_APPLICATIONS } from './data/initialApplications';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { ContactUsPage } from './components/ContactUsPage';
import { ApplicationForm } from './components/ApplicationForm';
import { StatusTracker } from './components/StatusTracker';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { GitHubExportModal } from './components/GitHubExportModal';
import { LogoUploadModal } from './components/LogoUploadModal';
import { HeroImageModal } from './components/HeroImageModal';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { 
  getStoredCustomization, 
  saveStoredCustomization, 
  fetchCustomization,
  SiteCustomization 
} from './lib/customizationStore';
import {
  fetchApplications,
  saveApplicationToDb,
  fetchBikes,
  saveBikeToDb,
  deleteBikeFromDb,
} from './lib/supabase';

export default function App() {
  // Default tab is HOME (Bikes and Pricing + Hero Section)
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [applications, setApplications] = useState<RiderApplication[]>(INITIAL_APPLICATIONS);
  const [bikes, setBikes] = useState<Bike[]>(BIKES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Custom branding (Logo & Hero Image)
  const [customization, setCustomization] = useState<SiteCustomization>(getStoredCustomization());
  const [showLogoModal, setShowLogoModal] = useState<boolean>(false);
  const [showHeroModal, setShowHeroModal] = useState<boolean>(false);

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

  // Initial Load from Supabase (with fallback to cached data)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [loadedApps, loadedBikes, loadedCustomization] = await Promise.all([
          fetchApplications(),
          fetchBikes(),
          fetchCustomization(),
        ]);
        if (loadedApps) {
          setApplications(loadedApps);
        }
        if (loadedBikes && loadedBikes.length > 0) {
          setBikes(loadedBikes);
        }
        if (loadedCustomization) {
          setCustomization(loadedCustomization);
        }
      } catch (err) {
        console.warn('Could not load from remote database, using cached data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSaveLogo = (logoUrl: string) => {
    const updated = saveStoredCustomization({ logoUrl });
    setCustomization(updated);
  };

  const handleSaveHeroImage = (heroImageUrl: string) => {
    const updated = saveStoredCustomization({ heroImageUrl });
    setCustomization(updated);
  };

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
    setApplications((prev) => {
      const exists = prev.some((app) => app.id === updated.id);
      if (exists) {
        return prev.map((app) => (app.id === updated.id ? updated : app));
      }
      return [updated, ...prev];
    });
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

  const handleAddNewWalkin = async (newWalkin?: RiderApplication) => {
    if (newWalkin) {
      setApplications((prev) => [newWalkin, ...prev]);
      await saveApplicationToDb(newWalkin);
      return;
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setActiveTab('admin');
    setShowAdminLoginModal(false);
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

  const handleViewStatus = (refNumber: string) => {
    setStatusSearchQuery(refNumber);
    setActiveTab('status');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingCount = applications.filter((a) => a.status === 'pending_review').length;
  const isAdminView = activeTab === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Global Navigation Header (Hidden when inside Admin portal as requested) */}
      {!isAdminView && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customLogoUrl={customization.logoUrl}
          pendingCount={pendingCount}
        />
      )}

      {/* 2. Main Content View Switcher */}
      <main className="flex-1">
        {/* HOME VIEW: Bike Catalog + Pricing + Static Hero Section */}
        {(activeTab === 'home' || activeTab === 'fleet') && (
          <HomePage
            bikes={bikes}
            heroImageUrl={customization.heroImageUrl}
            onSelectBikeForApplication={handleSelectBikeForApplication}
            onApplyNow={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLearnMore={() => {
              setActiveTab('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* ABOUT VIEW: How Dynamic Rental Works */}
        {activeTab === 'about' && (
          <AboutPage
            onApplyNow={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewFleet={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onContactUs={() => {
              setActiveTab('contact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* CONTACT US VIEW: Matching dynamicrental.info screenshot */}
        {(activeTab === 'contact' || activeTab === 'location') && (
          <ContactUsPage
            onApplyNow={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* APPLY NOW VIEW: 2-Minute Digital Application */}
        {activeTab === 'apply' && (
          <div className="py-8">
            <ApplicationForm
              bikes={bikes}
              initialBikeId={selectedBikeForApp.bikeId}
              initialCondition={selectedBikeForApp.condition}
              initialTerm={selectedBikeForApp.termMonths}
              onApplicationSubmitted={handleApplicationSubmitted}
              onViewStatus={handleViewStatus}
            />
          </div>
        )}

        {/* TRACK STATUS VIEW */}
        {activeTab === 'status' && (
          <div className="py-8">
            <StatusTracker
              applications={applications}
              initialSearchQuery={statusSearchQuery}
              onApplyNew={() => {
                setActiveTab('apply');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ADMIN PORTAL VIEW (Standalone full workspace with dedicated Sidebar & no top header) */}
        {activeTab === 'admin' && (
          <AdminPortal
            applications={applications}
            bikes={bikes}
            onUpdateApplication={handleUpdateApplication}
            onSaveBike={handleSaveBike}
            onDeleteBike={handleDeleteBike}
            onAddNewWalkin={handleAddNewWalkin}
            onSaveLogo={handleSaveLogo}
            onSaveHeroImage={handleSaveHeroImage}
            customLogoUrl={customization.logoUrl}
            customHeroUrl={customization.heroImageUrl}
            onCloseAdmin={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Floating WhatsApp Quick-Contact Button (Only on public views) */}
      {!isAdminView && <WhatsAppFloatingButton />}

      {/* Dynamic Rental Teal/Cyan Footer (Only on public views) */}
      {!isAdminView && (
        <Footer
          onOpenAdminLogin={handleOpenAdminFromFooter}
          onOpenGitHubModal={() => setShowGitHubModal(true)}
          isAdminLoggedIn={isAdminLoggedIn}
        />
      )}

      {/* Custom Logo Upload Modal */}
      <LogoUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        currentLogoUrl={customization.logoUrl}
        onSaveLogo={handleSaveLogo}
      />

      {/* Hero Image Customizer Modal */}
      <HeroImageModal
        isOpen={showHeroModal}
        onClose={() => setShowHeroModal(false)}
        currentHeroUrl={customization.heroImageUrl}
        onSaveHeroImage={handleSaveHeroImage}
      />

      {/* Admin Login Modal (Triggered from Footer) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* GitHub / Vercel Publish Modal */}
      <GitHubExportModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />
    </div>
  );
}
