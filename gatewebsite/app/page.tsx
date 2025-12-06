'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CTAInput from '@/components/CTAInput';
import Modal from '@/components/Modal';
import AuthModal from '@/components/AuthModal';
import EndpointRateEditor from '@/components/EndpointRateEditor';
import { Endpoint } from '@/components/EndpointTable';
import { Loader2, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');

  const handleScan = async (url: string) => {
    // Require authentication before scanning
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan URL');
      }

      if (data.endpoints && data.endpoints.length > 0) {
        setEndpoints(data.endpoints);
        setServiceName(new URL(url).hostname); // Default name
        setIsModalOpen(true);
      } else {
        alert('No endpoints found in the provided URL. Please check the content.');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to scan URL');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName,
          description,
          endpoints,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/success?id=${data.serviceId}`);
      } else {
        alert('Failed to publish service');
      }
    } catch (error) {
      console.error(error);
      alert('Error publishing service');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-monokai-gray/30 bg-monokai-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link href="/" className="text-xl font-bold text-monokai-fg">
            Gate<span className="text-monokai-pink">402</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/registry"
              className="text-sm text-monokai-blue hover:text-monokai-fg transition-colors"
            >
              Registry
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-monokai-green hover:text-monokai-fg transition-colors"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-sm text-monokai-gray hover:text-monokai-fg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-lg bg-monokai-pink px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex min-h-screen flex-col items-center justify-center p-8 pt-24 text-center">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-monokai-fg md:text-7xl text-glow">
            Gate<span className="text-monokai-pink">402</span>
          </h1>
        <p className="text-xl text-monokai-gray md:text-2xl">
          Register your API to the <span className="text-monokai-blue">Agentic Internet</span>.
        </p>

        <div className="flex justify-center pt-8">
          <CTAInput
            onSubmit={handleScan}
            isLoading={isScanning}
            placeholder="https://mycompany.com"
            buttonText="Scan API"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 pt-16 md:grid-cols-3 text-left">
          <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-monokai-green">Discoverable</h3>
            <p className="text-sm text-monokai-fg/80">Make your API visible to AI agents instantly.</p>
          </div>
          <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-monokai-orange">Standardized</h3>
            <p className="text-sm text-monokai-fg/80">Automatic conversion to agent-ready formats.</p>
          </div>
          <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-monokai-purple">Monetized</h3>
            <p className="text-sm text-monokai-fg/80">Future-proof your API for the agent economy.</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Review & Publish"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-monokai-fg">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full rounded-lg border border-monokai-gray bg-monokai-bg px-4 py-2 text-monokai-fg focus:border-monokai-pink focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-monokai-fg">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-monokai-gray bg-monokai-bg px-4 py-2 text-monokai-fg focus:border-monokai-pink focus:outline-none"
                rows={3}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-monokai-gray uppercase">Set Rates for Endpoints</h3>
            <p className="text-xs text-monokai-gray/70 mb-4">
              Configure x402 rates for each endpoint. Leave at 0 for free endpoints.
            </p>
            <EndpointRateEditor endpoints={endpoints} onEndpointsChange={setEndpoints} />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 rounded-lg bg-monokai-green px-6 py-3 font-bold text-monokai-bg transition-transform hover:scale-105 disabled:opacity-50"
            >
              {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Service
            </button>
          </div>
        </div>
      </Modal>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </main>
    </>
  );
}
