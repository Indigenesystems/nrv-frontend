// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  accountType: 'landlord' | 'tenant' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  nin?: string;
  homeAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserToken = {
  user: any; // Replace 'any' with your actual user type if available
  accessToken: string;
  notificationSettings?: any;
};

// Property Types
export interface Property {
  _id: string;
  streetAddress: string;
  unit?: string;
  city: string;
  state: string;
  propertyType: string;
  ownerId: string;
  rentAmount: number;
  rentStartDate?: string;
  rentEndDate?: string;
  status: 'available' | 'occupied' | 'maintenance';
  images: string[];
  description?: string;
  amenities?: string[];
  createdAt: string;
  updatedAt: string;
}

// Application Types
export enum ApplicationStatus {
  NEW = 'New',
  ACCEPTED = 'Accepted',
  ACTIVE_LEASE = 'Active_lease',
  EXPIRED = 'Expired',
  ENDED = 'Ended',
  REJECTED = 'Rejected',
}

export interface Application {
  _id: string;
  propertyId: string;
  tenantId: string;
  status: ApplicationStatus;
  appliedDate: string;
  documents: string[];
  screeningReport?: string;
  createdAt: string;
  updatedAt: string;
}

// Maintenance Types
export interface MaintenanceRequest {
  _id: string;
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Message Types
export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'document';
  attachments?: string[];
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Document Types
export interface Document {
  _id: string;
  name: string;
  type: 'lease' | 'receipt' | 'maintenance' | 'screening' | 'other';
  url: string;
  uploadedBy: string;
  propertyId?: string;
  tenantId?: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  accountType: 'landlord' | 'tenant' | 'shortlet_manager';
  nin?: string;
  homeAddress?: string;
  file?: File | null;
  acceptedTerms?: boolean;
}

export interface PropertyFormData {
  streetAddress: string;
  unit?: string;
  city: string;
  state: string;
  propertyType: string;
  rentAmount: number;
  description?: string;
  amenities?: string[];
  images?: File[];
}

// UI Component Types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

export interface FilterOption {
  name: string;
  label: string;
  options: SelectOption[];
}

// Chart Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface FinancialData {
  month: string;
  income: number;
  expenses: number;
}

// Dashboard Types
export interface DashboardMetrics {
  totalProperties: number;
  totalTenants: number;
  totalApplications: number;
  totalMaintenanceRequests: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

// Verification Types
export interface VerificationData {
  bvn: string;
  nin: string;
  phoneNumber: string;
  email: string;
}

export interface ScreeningReport {
  _id: string;
  tenantId: string;
  bvnConfirmed: boolean;
  ninConfirmed: boolean;
  criminalRecord: boolean;
  evictionHistory: boolean;
  creditScore?: number;
  reportUrl?: string;
  createdAt: string;
}

// Utility Types
export type LoadingState = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// Redux Types
export interface RootState {
  user: AsyncState<UserToken>;
  property: AsyncState<Property[]>;
  maintenance: AsyncState<MaintenanceRequest[]>;
  messages: AsyncState<Message[]>;
  document: AsyncState<Document[]>;
  verification: AsyncState<ScreeningReport>;
} 