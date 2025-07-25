import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

async function makeRuckusApiCall<T = any>(
  config: AxiosRequestConfig,
  operationName: string
): Promise<AxiosResponse<T>> {
  try {
    return await axios(config);
  } catch (error: any) {
    if (error.response) {
      // Create a more detailed error message
      let errorMessage = `${operationName} failed with status ${error.response.status}`;
      
      // Add specific API error details if available
      if (error.response.data) {
        // Handle RUCKUS API error format
        if (error.response.data.error) {
          errorMessage += ` - API Error: ${error.response.data.error}`;
        }
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const firstError = error.response.data.errors[0];
          if (firstError) {
            if (firstError.code) {
              errorMessage += ` - Error Code: ${firstError.code}`;
            }
            if (firstError.message) {
              errorMessage += ` - Error Message: ${firstError.message}`;
            }
            if (firstError.reason) {
              errorMessage += ` - Reason: ${firstError.reason}`;
            }
          }
        }
        if (error.response.data.message) {
          errorMessage += ` - Message: ${error.response.data.message}`;
        }
        if (error.response.data.code) {
          errorMessage += ` - Code: ${error.response.data.code}`;
        }
        if (error.response.data.details) {
          errorMessage += ` - Details: ${JSON.stringify(error.response.data.details)}`;
        }
      }
      
      const detailedError = new Error(errorMessage) as any;
      detailedError.response = error.response;
      detailedError.request = error.request;
      detailedError.name = 'RuckusApiError';
      throw detailedError;
    }
    throw error;
  }
}

export async function getRuckusJwtToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
  region: string = ''
): Promise<string> {
  const url = `https://${region ? region + '.' : ''}ruckus.cloud/oauth2/token/${tenantId}`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await makeRuckusApiCall({
    method: 'post',
    url,
    data: params,
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  }, 'OAuth token request');

  return response.data.access_token;
} 

export async function getRuckusActivityDetails(
  token: string,
  activityId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/activities/${activityId}`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get activity details');

  return response.data;
}

export async function deleteVenueWithRetry(
  token: string,
  venueId: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/${venueId}`
    : `https://api.ruckus.cloud/venues/${venueId}`;

  const response = await makeRuckusApiCall({
    method: 'delete',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Delete venue');

  const deleteResponse = response.data;
  
  // Always get requestId for async tracking (delete operations always return requestId)
  const activityId = deleteResponse.requestId;
  
  if (!activityId) {
    throw new Error('No requestId returned from venue deletion API');
  }

  // Poll for completion status
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      
      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;
      
      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed = 
        activityDetails.status !== 'SUCCESS' && 
        activityDetails.status !== 'INPROGRESS';

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === 'SUCCESS') {
          return {
            ...deleteResponse,
            activityDetails,
            status: 'completed',
            message: 'Venue deleted successfully'
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: 'failed',
            message: 'Venue deletion failed',
            error: activityDetails.error || activityDetails.message || 'Operation completed with non-SUCCESS status'
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: 'failed',
          message: 'Venue deletion failed',
          error: activityDetails.error || activityDetails.message || 'Unknown error'
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(`[RUCKUS] Venue deletion in progress, attempt ${retryCount}/${maxRetries}`);
      
      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      retryCount++;
      console.error(`[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`, error);
      
      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: 'timeout',
          message: 'Venue deletion status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: 'timeout',
    message: 'Venue deletion status unknown - polling timeout',
    activityId
  };
}

export async function createVenueWithRetry(
  token: string,
  venueData: {
    name: string;
    addressLine: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues`
    : 'https://api.ruckus.cloud/venues';

  const payload = {
    name: venueData.name,
    address: {
      addressLine: venueData.addressLine,
      city: venueData.city,
      country: venueData.country,
      ...(venueData.latitude !== undefined && { latitude: venueData.latitude }),
      ...(venueData.longitude !== undefined && { longitude: venueData.longitude }),
      ...(venueData.timezone && { timezone: venueData.timezone }),
    },
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Create venue');

  const createResponse = response.data;
  
  // Always get requestId for async tracking (create operations always return requestId)
  const activityId = createResponse.requestId;
  
  if (!activityId) {
    throw new Error('No requestId returned from venue creation API');
  }

  // Poll for completion status
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      
      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;
      
      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed = 
        activityDetails.status !== 'SUCCESS' && 
        activityDetails.status !== 'INPROGRESS';

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === 'SUCCESS') {
          return {
            ...createResponse,
            activityDetails,
            status: 'completed',
            message: 'Venue created successfully'
          };
        } else {
          return {
            ...createResponse,
            activityDetails,
            status: 'failed',
            message: 'Venue creation failed',
            error: activityDetails.error || activityDetails.message || 'Operation completed with non-SUCCESS status'
          };
        }
      }

      if (isFailed) {
        return {
          ...createResponse,
          activityDetails,
          status: 'failed',
          message: 'Venue creation failed',
          error: activityDetails.error || activityDetails.message || 'Unknown error'
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(`[RUCKUS] Venue creation in progress, attempt ${retryCount}/${maxRetries}`);
      
      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      retryCount++;
      console.error(`[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`, error);
      
      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...createResponse,
          status: 'timeout',
          message: 'Venue creation status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: 'timeout',
    message: 'Venue creation status unknown - polling timeout',
    activityId
  };
}

export async function createApGroupWithRetry(
  token: string,
  venueId: string,
  apGroupData: {
    name: string;
    description?: string;
    apSerialNumbers?: Array<{ serialNumber: string }>;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups`
    : `https://api.ruckus.cloud/venues/${venueId}/apGroups`;

  const payload = {
    name: apGroupData.name,
    venueId: venueId,
    apSerialNumbers: apGroupData.apSerialNumbers || [],
    ...(apGroupData.description && { description: apGroupData.description }),
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Create AP group');

  const createResponse = response.data;
  
  // Check if this is an async operation (has requestId)
  const activityId = createResponse.requestId;
  
  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...createResponse,
      status: 'completed',
      message: 'AP group created successfully (synchronous operation)'
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      
      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;
      
      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed = 
        activityDetails.status !== 'SUCCESS' && 
        activityDetails.status !== 'INPROGRESS';

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === 'SUCCESS') {
          return {
            ...createResponse,
            activityDetails,
            status: 'completed',
            message: 'AP group created successfully'
          };
        } else {
          return {
            ...createResponse,
            activityDetails,
            status: 'failed',
            message: 'AP group creation failed',
            error: activityDetails.error || activityDetails.message || 'Operation completed with non-SUCCESS status'
          };
        }
      }

      if (isFailed) {
        return {
          ...createResponse,
          activityDetails,
          status: 'failed',
          message: 'AP group creation failed',
          error: activityDetails.error || activityDetails.message || 'Unknown error'
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(`[RUCKUS] AP group creation in progress, attempt ${retryCount}/${maxRetries}`);
      
      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      retryCount++;
      console.error(`[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`, error);
      
      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...createResponse,
          status: 'timeout',
          message: 'AP group creation status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: 'timeout',
    message: 'AP group creation status unknown - polling timeout',
    activityId
  };
}

export async function queryApGroups(
  token: string,
  region: string = '',
  filters: any = {},
  fields: string[] = ['id', 'name'],
  page: number = 1,
  pageSize: number = 10000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/apGroups/query`
    : 'https://api.ruckus.cloud/venues/apGroups/query';

  const payload = {
    fields,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField: 'name',
    sortOrder: 'ASC'
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query AP groups');

  return response.data;
}

export async function deleteApGroupWithRetry(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`
    : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`;

  const response = await makeRuckusApiCall({
    method: 'delete',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Delete AP group');

  const deleteResponse = response.data;
  
  // Check if this is an async operation (has requestId)
  const activityId = deleteResponse.requestId;
  
  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...deleteResponse,
      status: 'completed',
      message: 'AP group deleted successfully (synchronous operation)'
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      
      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;
      
      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed = 
        activityDetails.status !== 'SUCCESS' && 
        activityDetails.status !== 'INPROGRESS';

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === 'SUCCESS') {
          return {
            ...deleteResponse,
            activityDetails,
            status: 'completed',
            message: 'AP group deleted successfully'
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: 'failed',
            message: 'AP group deletion failed',
            error: activityDetails.error || activityDetails.message || 'Operation completed with non-SUCCESS status'
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: 'failed',
          message: 'AP group deletion failed',
          error: activityDetails.error || activityDetails.message || 'Unknown error'
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(`[RUCKUS] AP group deletion in progress, attempt ${retryCount}/${maxRetries}`);
      
      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      retryCount++;
      console.error(`[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`, error);
      
      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: 'timeout',
          message: 'AP group deletion status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: 'timeout',
    message: 'AP group deletion status unknown - polling timeout',
    activityId
  };
}