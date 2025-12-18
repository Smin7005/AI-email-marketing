import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            B2B Email Marketing Platform
          </h1>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered Email Marketing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connect with Australian businesses using personalized AI-generated email campaigns
          </p>

          <SignedIn>
            <div className="flex gap-4 justify-center">
              <Link href="/businesses">
                <Button size="lg" className="text-lg px-8">
                  Find Business Leads
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Campaigns
                </Button>
              </Link>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex gap-4 justify-center">
              <SignInButton>
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Targeted Search</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Filter businesses by city, industry, and more to find your ideal prospects
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">AI-Powered Emails</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Generate personalized emails for each prospect using advanced AI technology
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Track Results</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor open rates, clicks, and responses to optimize your campaigns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
