export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VenuesResponse {
  data: Venue[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VenueCreateRequest {
  name: string;
  description?: string | undefined;
  addressLine: string;
  city: string;
  state?: string | undefined;
  postalCode?: string | undefined;
  country: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
  timezone?: string | undefined;
}

export interface VenueCreateResponse {
  requestId: string;
  message?: string;
}

export interface VenueDeleteResponse {
  requestId: string;
  message?: string;
}

export interface ActivityDetails {
  id: string;
  requestId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  type: string;
  description?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
  result?: Record<string, unknown>;
}

export interface ActivityDetailsResponse {
  data: ActivityDetails;
}

export interface ApGroup {
  id: string;
  name: string;
  description?: string;
  venueId: string;
  isDefault?: boolean;
  apCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApGroupsResponse {
  data: ApGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApGroupCreateRequest {
  name: string;
  description?: string | undefined;
  apSerialNumbers?: Array<{
    serialNumber: string;
  }> | undefined;
}

export interface ApGroupCreateResponse {
  requestId: string;
  message?: string;
}

export interface ApGroupDeleteResponse {
  requestId: string;
  message?: string;
}

export interface ApGroupsQueryParams {
  fields?: string[];
  filters?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VenuesQueryParams {
  fields?: string[];
  searchTargetFields?: string[];
  filters?: Record<string, unknown>;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
  defaultPageSize?: number;
  total?: number;
}

export interface ApiError {
  error: string;
  error_description?: string;
  message?: string;
  code?: string | number;
  details?: Record<string, unknown>;
}