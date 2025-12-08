'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart3, Building2, Mail, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardHeader() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/businesses',
      label: 'Business Search',
      icon: Search,
      active: pathname?.startsWith('/businesses'),
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
      icon: BarChart3,
      active: pathname?.startsWith('/analytics'),
    },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">B2B Email Platform</span>
              </div>
            </Link>

            <nav className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'flex items-center space-x-2',
                      item.active && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}