import React from 'react';
import { NavLink } from 'react-router-dom';
import { navigationConfig } from './navigationConfig';
import { Logo } from '../../Logo';

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  return (
  <div className="fixed inset-y-0 left-0 w-64 shadow-lg" style={{ background: '#ff9800' }}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b">
          <Logo className="h-8 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigationConfig.map((section) => (
            <div key={section.label} className="space-y-1">
              {section.label && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.label}
                </h3>
              )}
              
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t bg-gray-50 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-lg font-medium text-indigo-600">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
