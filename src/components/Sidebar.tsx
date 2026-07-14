/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Users, Award, CalendarCheck, BookOpen, BarChart3, Menu, X, GraduationCap, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';

interface SidebarProps {
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
  settings: AppSettings;
}

export default function Sidebar({ currentMenu, setCurrentMenu, mobileOpen, setMobileOpen, onLogout, settings }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'siswa', name: 'Kelola Siswa', icon: Users },
    { id: 'nilai', name: 'Kelola Nilai', icon: Award },
    { id: 'presensi', name: 'Kelola Presensi', icon: CalendarCheck },
    { id: 'pembelajaran', name: 'Kelola Pembelajaran', icon: BookOpen },
    { id: 'laporan', name: 'Laporan', icon: BarChart3 },
    { id: 'settings', name: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* HEADER MOBILE (Glassmorphic Top Bar) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-40 px-4 flex items-center justify-between border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-md overflow-hidden shrink-0">
            {settings.logoSekolah ? (
              <img src={settings.logoSekolah} alt="Logo Sekolah" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <GraduationCap className="text-white w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">{settings.kopSekolah || 'SMASA Online'}</h1>
            <span className="text-[10px] text-slate-500 font-medium">Mata Pelajaran {settings.mataPelajaran || 'Informatika'}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-slate-600 focus:outline-none"
          id="mobile-menu-toggle"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-neu-bg p-6 z-50 flex flex-col justify-between shadow-2xl border-r border-white/40"
          >
            <div>
              {/* Profile Card / Header */}
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
                <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden shrink-0">
                  {settings.logoSekolah ? (
                    <img src={settings.logoSekolah} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    'SM'
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{settings.kopSekolah || 'SMASA Online'}</h2>
                  <p className="text-xs text-slate-500">{settings.mataPelajaran || 'Informatika'}</p>
                </div>
              </div>

              {/* Menu List */}
              <nav className="space-y-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentMenu(item.id);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                        isActive
                          ? 'text-blue-600 font-semibold neu-inset'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                      id={`mobile-nav-${item.id}`}
                    >
                      <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                      <span className="text-sm">{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                id="mobile-logout-btn"
              >
                <LogOut size={16} />
                <span>Logout Guru</span>
              </button>

              {/* Footer Profile */}
              <div className="p-4 rounded-2xl neu-inset flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  GA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Guru Admin</h4>
                  <p className="text-[10px] text-slate-500">Informatika XI</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR (Neumorphic Sticky Navigation) */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 p-6 bg-neu-bg border-r border-white/40 shadow-sm shrink-0">
        <div>
          {/* Logo Brand Panel */}
          <div className="flex items-center gap-3.5 mb-10 p-2.5 rounded-2xl neu-inset">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 overflow-hidden shrink-0">
              {settings.logoSekolah ? (
                <img src={settings.logoSekolah} alt="Logo Sekolah" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <GraduationCap className="text-white w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-none">{settings.kopSekolah || 'SMASA Online'}</h2>
              <span className="text-[10px] font-medium text-slate-500">{settings.mataPelajaran || 'Informatika'}</span>
            </div>
          </div>

          {/* Navigasi Utama */}
          <nav className="space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentMenu(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                    isActive
                      ? 'text-blue-600 font-semibold neu-inset'
                      : 'text-slate-600 hover:text-blue-600 hover:translate-x-1'
                  }`}
                  id={`desktop-nav-${item.id}`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'} />
                  <span className="text-sm">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-red-100 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            id="desktop-logout-btn"
          >
            <LogOut size={16} />
            <span>Logout Guru</span>
          </button>

          {/* Administrator Profile Widget */}
          <div className="p-4 rounded-2xl neu-inset flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              GA
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Guru Administrator</h4>
              <p className="text-[10px] text-slate-500">admin@smasa.sch.id</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Optional but beautiful layout enhancement for small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass z-40 flex justify-around items-center border-t border-white/20 px-2 shadow-lg">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentMenu(item.id)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                isActive ? 'text-blue-600 font-semibold scale-110' : 'text-slate-500'
              }`}
              id={`bottom-nav-${item.id}`}
            >
              <Icon size={18} />
              <span className="text-[9px] mt-0.5 tracking-tight font-medium">{item.name.replace('Kelola ', '')}</span>
            </button>
          );
        })}
        {/* Toggle Laporan/More for bottom bar */}
        <button
          onClick={() => setCurrentMenu('laporan')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
            currentMenu === 'laporan' ? 'text-blue-600 font-semibold scale-110' : 'text-slate-500'
          }`}
          id={`bottom-nav-laporan`}
        >
          <BarChart3 size={18} />
          <span className="text-[9px] mt-0.5 tracking-tight font-medium">Laporan</span>
        </button>
      </nav>
    </>
  );
}
