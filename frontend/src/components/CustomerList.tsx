import React, { useState, useEffect } from 'react';
import { Customer } from '../types/Customer';
import { customerService } from '../services/customerService';

interface CustomerListProps {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  refreshTrigger: number;
}

const CustomerList: React.FC<CustomerListProps> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [refreshTrigger]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      loadCustomers();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await customerService.searchCustomers(searchEmail);
      setCustomers(data);
    } catch (err) {
      setError('Failed to search customers');
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchEmail('');
    loadCustomers();
  };

  if (loading) return <div className="loading">Loading customers...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="customer-list">
      <div className="search-section">
        <input
          type="email"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={handleClearSearch}>Clear</button>
      </div>

      {customers.length === 0 ? (
        <div className="no-customers">No customers found</div>
      ) : (
        <div className="table-container">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customerId}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.address || '-'}</td>
                  <td>{new Date(customer.registrationDate).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="edit-btn"
                      onClick={() => onEdit(customer)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => onDelete(customer)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
