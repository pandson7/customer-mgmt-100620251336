export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  registrationDate: string;
  lastModified: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}
