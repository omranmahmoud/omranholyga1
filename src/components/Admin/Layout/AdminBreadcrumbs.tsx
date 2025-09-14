import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { AdminRoutes } from './navigationConfig';

export function AdminBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Find current route
  const currentRoute = AdminRoutes.find(route => 
    route.path === location.pathname || 
    route.path === `/admin/${pathSegments[pathSegments.length - 1]}`
  );

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link
        to="/admin"
        className="text-gray-500 hover:text-gray-700 flex items-center"
      >
        <Home className="w-4 h-4" />
      </Link>

      <ChevronRight className="w-4 h-4 text-gray-400" />
      
      {currentRoute && (
        <span className="text-gray-900 font-medium">
          {currentRoute.name}
        </span>
      )}
    </nav>
  );
}
