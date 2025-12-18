'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Folder, Mail, BarChart2, Settings, Users } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();

  const primaryMenuItems = [
    {
      href: '/leads',
      label: 'Leads',
      icon: Search,
      active: pathname?.startsWith('/leads'),
    },
    {
      href: '/collections',
      label: 'Collections',
      icon: Folder,
      active: pathname?.startsWith('/collections'),
    },
    {
      href: '/campaigns',
      label: 'Campaigns',
      icon: Mail,
      active: pathname?.startsWith('/campaigns'),
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart2,
      active: pathname?.startsWith('/analytics'),
    },
  ];

  const secondaryMenuItems = [
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname?.startsWith('/settings'),
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">B2B Email Platform</span>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {primaryMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                item.active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                item.active ? 'text-blue-700' : 'text-gray-500'
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="space-y-1">
          {secondaryMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  item.active ? 'text-blue-700' : 'text-gray-500'
                )} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Button */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-center">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}
