import React, { useState } from 'react';
import './App.css';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import DeleteConfirmation from './components/DeleteConfirmation';
import { Customer } from './types/Customer';

type ViewMode = 'list' | 'create' | 'edit' | 'delete';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setViewMode('create');
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewMode('edit');
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewMode('delete');
  };

  const handleSave = () => {
    setViewMode('list');
    setSelectedCustomer(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedCustomer(null);
  };

  const handleDeleteConfirm = () => {
    setViewMode('list');
    setSelectedCustomer(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Customer Management System</h1>
        {viewMode === 'list' && (
          <button className="create-btn" onClick={handleCreateNew}>
            Add New Customer
          </button>
        )}
      </header>

      <main className="App-main">
        {viewMode === 'list' && (
          <CustomerList
            onEdit={handleEdit}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <CustomerForm
            customer={selectedCustomer || undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'delete' && selectedCustomer && (
          <DeleteConfirmation
            customer={selectedCustomer}
            onConfirm={handleDeleteConfirm}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
}

export default App;
