'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function DashboardTutorial() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Get started with B2B Platform</h3>
      
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-900 mb-1">Find your first leads</h4>
            <p className="text-sm text-gray-600 mb-2">
              Search our database to find your ideal Australian business prospects.
            </p>
            <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              Go to leads
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-900 mb-1">Create your campaign</h4>
            <p className="text-sm text-gray-600 mb-2">
              Select a collection and use AI to generate personalized emails.
            </p>
            <Link href="/campaigns" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              Go to campaigns
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 flex justify-end">
        <Link href="/campaigns/create">
          <Button className="w-full sm:w-auto">
            Create Campaign
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
