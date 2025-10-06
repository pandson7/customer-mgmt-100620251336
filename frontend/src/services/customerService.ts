import axios from 'axios';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types/Customer';

const API_BASE_URL = 'https://tg9xgueenl.execute-api.us-east-1.amazonaws.com/prod';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerService = {
  // Get all customers
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Get customer by ID
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customer: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post('/customers', customer);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id: string, customer: UpdateCustomerRequest): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, customer);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Search customers by email
  searchCustomers: async (email: string): Promise<Customer[]> => {
    const response = await api.get(`/customers?search=${encodeURIComponent(email)}`);
    return response.data;
  },
};
