'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardCheck,
  Briefcase,
  Wallet,
  UserCircle,
  Bell,
  ChevronRight,
  LogOut,
  Menu,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface CarePartnerLayoutProps {
  carePartnerName: string;
  carePartnerId: string;
  activeView: string;
  onViewChange: (view: string) => void;
  notifications: { id: string; isRead: boolean }[];
  children: React.ReactNode;
  onSignOut: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shifts', label: 'My Shifts', icon: Briefcase },
  { id: 'patients', label: 'Care Members', icon: Users },
  { id: 'care-tasks', label: 'Care Tasks', icon: ClipboardCheck },
  { id: 'schedule', label: 'My Schedule', icon: CalendarDays, mobile: false },
  { id: 'earnings', label: 'Earnings', icon: Wallet, mobile: false },
  { id: 'profile', label: 'My Profile', icon: UserCircle, mobile: false },
  { id: 'notifications', label: 'Notifications', icon: Bell, mobile: false },
];

const mobileNavItems = navItems.filter((item) => item.mobile !== false);
const moreNavItems = navItems.filter((item) => item.mobile === false);

export default function CarePartnerLayout({
  carePartnerName,
  carePartnerId,
  activeView,
  onViewChange,
  notifications,
  children,
  onSignOut,
}: CarePartnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const initials = carePartnerName.charAt(0).toUpperCase();
  const activeLabel =
    navItems.find((item) => item.id === activeView)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-white border-r border-gray-200 md:flex">
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-5 py-5">
          <Image
            src="/logo.svg"
            alt="Nurturee"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <p className="text-base font-bold leading-tight">Nurturee</p>
            <p className="text-xs text-blue-600">Care Partner</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 font-medium text-blue-700 border-l-[3px] border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'
                    }`}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Profile / Sign Out Section */}
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {carePartnerName}
              </p>
              <p className="truncate text-xs text-gray-500">{carePartnerId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-5 py-5">
            <Image
              src="/logo.svg"
              alt="Nurturee"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <p className="text-base font-bold leading-tight">Nurturee</p>
              <p className="text-xs text-blue-600">Care Partner</p>
            </div>
          </div>

          {/* Navigation Items */}
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Navigation</SheetDescription>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onViewChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 font-medium text-blue-700 border-l-[3px] border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'
                      }`}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && <ChevronRight className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Profile / Sign Out Section */}
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {carePartnerName}
                </p>
                <p className="truncate text-xs text-gray-500">{carePartnerId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSignOut();
                setSidebarOpen(false);
              }}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile "More" Sheet */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="max-h-[60vh]">
          <SheetHeader>
            <SheetTitle>More Options</SheetTitle>
            <SheetDescription>
              Additional navigation items
            </SheetDescription>
          </SheetHeader>
          <nav className="overflow-y-auto px-2 pb-4">
            <ul className="flex flex-col gap-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onViewChange(item.id);
                        setMoreSheetOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 font-medium text-blue-700 border-l-[3px] border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'
                      }`}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && <ChevronRight className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Area (right of sidebar on desktop) */}
      <div className="md:ml-[260px]">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-lg md:px-6">
          {/* Left: Hamburger (mobile) + Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-lg p-3 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{activeLabel}</h1>
          </div>

          {/* Right: Notification Bell + Avatar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onViewChange('notifications')}
              className="relative inline-flex items-center justify-center rounded-lg p-3 text-gray-600 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex size-8 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-semibold text-blue-700">
              {initials}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="bg-gray-50 p-4 pb-20 md:p-6 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10, pointerEvents: 'auto' }}
              animate={{ opacity: 1, y: 0, pointerEvents: 'auto' }}
              exit={{ opacity: 0, y: -10, pointerEvents: 'none' }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center border-t border-gray-200 bg-white/95 backdrop-blur-lg md:hidden">
        <div className="flex w-full">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="size-5" />
                <span className="text-[11px] leading-tight">{item.label}</span>
              </button>
            );
          })}
          {/* More button (5th position) */}
          <button
            type="button"
            onClick={() => setMoreSheetOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <Menu className="size-5" />
            <span className="text-[11px] leading-tight">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
