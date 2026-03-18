import Link from 'next/link';
import { ShieldCheck, Activity, Video, Pill } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">HealthBridge</span>
              <span className="text-2xl font-bold text-blue-600">HealthBridge</span>
            </a>
          </div>
          <div className="flex flex-1 justify-end space-x-4">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main className="isolate">
        {/* Hero section */}
        <div className="relative px-6 lg:px-8 pt-24 pb-16">
          <div className="mx-auto max-w-2xl text-center py-20 sm:py-32 lg:py-40">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                MVP Pilot Deploying in Addis Ababa, Ethiopia.{' '}
                <a href="/register" className="font-semibold text-blue-600">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Read more <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Virtual Healthcare & Medicine Delivery Made Simple
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect directly with healthcare professionals through secure video consultations. Find your prescribed medications at a local pharmacy, and track your health metrics seamlessly.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get Started
              </Link>
              <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
                Log in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Comprehensive Portal</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for remote care
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-lg"><Video className="h-6 w-6 flex-none text-blue-600" aria-hidden="true" /></div>
                  Telehealth Consultations
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Book virtual appointments with certified practitioners and meet over high-quality video links powered by Agora.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg"><Pill className="h-6 w-6 flex-none text-green-600" aria-hidden="true" /></div>
                  Drug Finder
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Instantly locate the medications prescribed to you within registered local pharmacies showing real-time stock levels.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="p-2 bg-red-100 rounded-lg"><Activity className="h-6 w-6 flex-none text-red-600" aria-hidden="true" /></div>
                  Health Tracker
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Input vital signs securely. Your doctors automatically receive notifications if your blood pressure or heart rate exceed safe thresholds.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-center py-8 text-gray-400 text-sm">
        <p>&copy; 2026 HealthBridge. MVP Implementation for Addis Ababa.</p>
      </footer>
    </div>
  );
}
