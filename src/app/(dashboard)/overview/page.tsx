import OverviewCalendar from '@/components/dashboard/OverviewCalendar';
import DashboardTutorial from '@/components/dashboard/DashboardTutorial';

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">
          AI-Powered Email Marketing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect with Australian businesses using personalized AI-generated email campaigns
        </p>
      </div>

      {/* Top Section - Calendar and Tutorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Calendar */}
        <div className="lg:col-span-4">
          <OverviewCalendar />
        </div>

        {/* Right Column - Tutorial */}
        <div className="lg:col-span-8">
          <DashboardTutorial />
        </div>
      </div>

      {/* Bottom Section - Feature Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Targeted Search</h3>
            <p className="text-gray-600">
              Filter businesses by city, industry, and more to find your ideal prospects
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-900">AI-Powered Emails</h3>
            <p className="text-gray-600">
              Generate personalized emails for each prospect using advanced AI technology
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Track Results</h3>
            <p className="text-gray-600">
              Monitor open rates, clicks, and responses to optimize your campaigns
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Optional */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Use the sidebar to navigate to different sections
        </p>
      </div>
    </div>
  );
}
