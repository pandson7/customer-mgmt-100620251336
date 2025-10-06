import React, { useState } from 'react';
import { Customer } from '../types/Customer';
import { customerService } from '../services/customerService';

interface DeleteConfirmationProps {
  customer: Customer;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ customer, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await customerService.deleteCustomer(customer.customerId);
      onConfirm();
    } catch (err) {
      setError('Failed to delete customer');
      console.error('Error deleting customer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-confirmation">
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Confirm Delete</h3>
          <p>
            Are you sure you want to delete customer <strong>{customer.name}</strong> ({customer.email})?
          </p>
          <p className="warning">This action cannot be undone.</p>
          
          {error && <div className="error">{error}</div>}
          
          <div className="modal-actions">
            <button 
              className="delete-btn"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
            <button 
              className="cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
