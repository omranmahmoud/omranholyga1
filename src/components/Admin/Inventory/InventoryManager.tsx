import { useState } from 'react';
import type { InventoryItem } from '../../../services/inventoryService';
import { Package, AlertTriangle, Plus, BarChart3 } from 'lucide-react';
import { AddInventoryModal } from './AddInventoryModal';
import { InventoryModal } from './InventoryModal';
import { InventoryList } from './InventoryList';
import { InventoryFilters } from './InventoryFilters';
import { InventoryAnalytics } from './Analytics/InventoryAnalytics';
import { useInventory } from '../../../hooks/useInventory';
import { useAuth } from '../../../context/AuthContext';
import { ErrorBoundary } from '../../ErrorBoundary';
import { LoadingSpinner } from '../../LoadingSpinner';

export function InventoryManager() {
  const { user } = useAuth();
  
  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need admin privileges to access inventory management.</p>
      </div>
    );
  }

  const { 
    inventory, 
    loading, 
    error,
    updateInventory, 
    addInventory,
    refreshInventory
  } = useInventory({
    autoFetch: user?.role === 'admin',
    retryOnError: true,
    maxRetries: 3
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const locations = [...new Set(inventory.map(item => item.location))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesLocation = !locationFilter || item.location === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Inventory</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => refreshInventory()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your product inventory and view analytics
            </p>
          </div>
          {activeTab === 'inventory' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Inventory
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'inventory' && (
          <>
            <InventoryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              locations={locations}
            />

            {loading ? (
              <LoadingSpinner />
            ) : inventory.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h3>
                <p className="text-gray-500">Add your first inventory item to get started.</p>
              </div>
            ) : (
              <InventoryList 
                items={filteredInventory}
                onEdit={(item) => {
                  setEditItem(item);
                  setEditModalOpen(true);
                }}
                onInlineEdit={async (item, newQuantity) => {
                  await updateInventory(item._id, newQuantity);
                }}
              />
            )}

            <AddInventoryModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={addInventory}
            />
            <InventoryModal
              isOpen={editModalOpen}
              onClose={() => {
                setEditModalOpen(false);
                setEditItem(null);
              }}
              onSubmit={async (data) => {
                if (editItem) {
                  await updateInventory(editItem._id, data.quantity);
                }
                setEditModalOpen(false);
                setEditItem(null);
              }}
              item={editItem}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <InventoryAnalytics />
        )}
      </div>
    </ErrorBoundary>
  );
}
