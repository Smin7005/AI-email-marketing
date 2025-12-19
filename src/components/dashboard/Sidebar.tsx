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
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/overview" className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-bold text-white">B2B Email Platform</span>
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
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                item.active ? 'text-white' : 'text-gray-400'
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-4 py-2 border-t border-slate-800">
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  item.active ? 'text-white' : 'text-gray-400'
                )} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Button */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex justify-center">
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
