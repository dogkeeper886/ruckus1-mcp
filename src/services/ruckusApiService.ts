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

export async function getVenueExternalAntennaSettings(
  token: string,
  venueId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apModelExternalAntennaSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get venue external antenna settings');

  return response.data;
}

export async function getVenueAntennaTypeSettings(
  token: string,
  venueId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apModelAntennaTypeSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get venue antenna type settings');

  return response.data;
}

export async function getApGroupExternalAntennaSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apModelExternalAntennaSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get AP group external antenna settings');

  return response.data;
}

export async function getApGroupAntennaTypeSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apModelAntennaTypeSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get AP group antenna type settings');

  return response.data;
}

export async function getVenueApModelBandModeSettings(
  token: string,
  venueId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apModelBandModeSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get venue AP model band mode settings');

  return response.data;
}

export async function getVenueRadioSettings(
  token: string,
  venueId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apRadioSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get venue radio settings');

  return response.data;
}

export async function getApGroupApModelBandModeSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apModelBandModeSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get AP group AP model band mode settings');

  return response.data;
}

export async function getApGroupRadioSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/radioSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get AP group radio settings');

  return response.data;
}

export async function getApRadioSettings(
  token: string,
  venueId: string,
  apSerialNumber: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}/radioSettings`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get AP radio settings');

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

export async function updateVenueWithRetry(
  token: string,
  venueId: string,
  venueData: {
    name: string;
    description?: string;
    addressLine: string;
    city: string;
    country: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/${venueId}`
    : `https://api.ruckus.cloud/venues/${venueId}`;

  const payload = {
    name: venueData.name,
    ...(venueData.description !== undefined && { description: venueData.description }),
    address: {
      addressLine: venueData.addressLine,
      city: venueData.city,
      country: venueData.country,
      ...(venueData.countryCode && { countryCode: venueData.countryCode }),
      ...(venueData.latitude !== undefined && { latitude: venueData.latitude }),
      ...(venueData.longitude !== undefined && { longitude: venueData.longitude }),
      ...(venueData.timezone && { timezone: venueData.timezone }),
    },
  };

  const response = await makeRuckusApiCall({
    method: 'put',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Update venue');

  const updateResponse = response.data;
  
  const activityId = updateResponse.requestId;
  
  if (!activityId) {
    return {
      ...updateResponse,
      status: 'completed',
      message: 'Venue updated successfully (synchronous operation)'
    };
  }

  console.log(`Starting venue update status polling for activity ${activityId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxRetries} for venue update activity ${activityId}`);
    
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`Activity status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        return {
          ...updateResponse,
          status: 'completed',
          message: 'Venue updated successfully',
          activityDetails
        };
      } else if (activityDetails.status === 'FAILED') {
        return {
          ...updateResponse,
          status: 'failed',
          message: 'Venue update failed',
          error: activityDetails.error || 'Unknown error occurred',
          activityDetails
        };
      }
      
      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: 'timeout',
          message: 'Venue update status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(`Error polling venue update activity (attempt ${attempt}):`, error.message);
      
      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: 'timeout',
          message: 'Venue update status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...updateResponse,
    status: 'timeout',
    message: 'Venue update status unknown - polling timeout',
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

export async function updateApGroupWithRetry(
  token: string,
  venueId: string,
  apGroupId: string,
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
    ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`
    : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`;

  const payload = {
    name: apGroupData.name,
    venueId: venueId,
    ...(apGroupData.description !== undefined && { description: apGroupData.description }),
    apSerialNumbers: apGroupData.apSerialNumbers || []
  };

  const response = await makeRuckusApiCall({
    method: 'put',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Update AP group');

  const updateResponse = response.data;
  
  const activityId = updateResponse.requestId;
  
  if (!activityId) {
    return {
      ...updateResponse,
      status: 'completed',
      message: 'AP group updated successfully (synchronous operation)'
    };
  }

  console.log(`Starting AP group update status polling for activity ${activityId}`);
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`[RUCKUS] AP group update activity ${activityId} status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        console.log(`[RUCKUS] AP group updated successfully after ${retryCount + 1} attempts`);
        return {
          ...updateResponse,
          status: 'completed',
          message: 'AP group updated successfully',
          activityDetails
        };
      } else if (activityDetails.status === 'FAILED') {
        console.error(`[RUCKUS] AP group update failed:`, activityDetails);
        return {
          ...updateResponse,
          status: 'failed',
          message: 'AP group update failed',
          error: activityDetails.error || 'Unknown error occurred',
          activityDetails
        };
      }
      
      retryCount++;
      console.log(`[RUCKUS] AP group update in progress, attempt ${retryCount}/${maxRetries}`);
      
      if (retryCount >= maxRetries) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      retryCount++;
      console.error(`[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        return {
          ...updateResponse,
          status: 'timeout',
          message: 'AP group update status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...updateResponse,
    status: 'timeout',
    message: 'AP group update status unknown - polling timeout',
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

export async function queryAPs(
  token: string,
  region: string = '',
  filters: any = {},
  fields: string[] = [
    'name', 'status', 'model', 'networkStatus', 'macAddress', 
    'venueName', 'switchName', 'meshRole', 'clientCount', 
    'apWiredClientCount', 'apGroupId', 'apGroupName', 
    'lanPortStatuses', 'tags', 'serialNumber', 'radioStatuses', 
    'venueId', 'poePort', 'firmwareVersion', 'uptime', 
    'afcStatus', 'powerSavingStatus', 'supportSecureBoot', 'poeUnderPowered'
  ],
  searchString: string = '',
  searchTargetFields: string[] = ['name', 'model', 'networkStatus.ipAddress', 'macAddress', 'tags', 'serialNumber'],
  page: number = 1,
  pageSize: number = 10,
  mesh: boolean = false
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/aps/query${mesh ? '?mesh=true' : ''}`
    : `https://api.ruckus.cloud/venues/aps/query${mesh ? '?mesh=true' : ''}`;

  const payload = {
    searchString,
    searchTargetFields,
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
  }, 'Query APs');

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

export async function getApDetailsBySerial(
  token: string,
  serialNumber: string,
  region: string = ''
): Promise<any> {
  const response = await queryAPs(
    token,
    region,
    {},
    [
      'name', 'status', 'model', 'networkStatus', 'macAddress', 
      'venueName', 'switchName', 'meshRole', 'clientCount', 
      'apWiredClientCount', 'apGroupId', 'apGroupName', 
      'lanPortStatuses', 'tags', 'serialNumber', 'radioStatuses', 
      'venueId', 'poePort', 'firmwareVersion', 'uptime', 
      'afcStatus', 'powerSavingStatus', 'supportSecureBoot', 'poeUnderPowered'
    ],
    serialNumber,
    ['serialNumber'],
    1,
    10
  );
  
  if (response.totalCount === 0) {
    throw new Error(`AP with serial number ${serialNumber} not found`);
  }
  
  return response.data[0];
}

export async function updateApWithRetrieval(
  token: string,
  serialNumber: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000,
  changes?: {
    name?: string;
    venueId?: string;
    apGroupId?: string;
    description?: string;
  }
): Promise<any> {
  // Step 1: Get current AP state
  const currentAp = await getApDetailsBySerial(token, serialNumber, region);
  
  // Step 2: Determine target venue (either new venue or current venue)
  const targetVenueId = changes?.venueId ?? currentAp.venueId;
  const targetApGroupId = changes?.apGroupId ?? currentAp.apGroupId;
  const targetName = changes?.name ?? currentAp.name;
  
  // Step 3: Perform update with complete payload
  // Always use 'direct' method as it's the only reliable way to move APs between groups
  return await moveApWithRetry(
    token,
    targetVenueId,
    serialNumber,
    targetApGroupId,
    targetName,
    changes?.description,
    'direct', // Always use direct method - it's the only one that actually works for group moves
    region,
    maxRetries,
    pollIntervalMs
  );
}

export async function moveApToVenue(
  token: string,
  serialNumber: string,
  targetVenueId: string,
  targetApGroupId: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  return updateApWithRetrieval(
    token,
    serialNumber,
    region,
    maxRetries,
    pollIntervalMs,
    { venueId: targetVenueId, apGroupId: targetApGroupId }
  );
}

export async function moveApToGroup(
  token: string,
  serialNumber: string,
  targetApGroupId: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  return updateApWithRetrieval(
    token,
    serialNumber,
    region,
    maxRetries,
    pollIntervalMs,
    { apGroupId: targetApGroupId }
  );
}

export async function renameAp(
  token: string,
  serialNumber: string,
  newName: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  return updateApWithRetrieval(
    token,
    serialNumber,
    region,
    maxRetries,
    pollIntervalMs,
    { name: newName }
  );
}

export async function moveApWithRetry(
  token: string,
  venueId: string,
  apSerialNumber: string,
  apGroupId: string,
  apName?: string,
  description?: string,
  method: 'direct' | 'update' = 'update',
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  let apiUrl: string;
  let payload: any = {};
  
  if (method === 'direct') {
    // Method 1: Direct group assignment
    apiUrl = region && region.trim() !== ''
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/aps/${apSerialNumber}`
      : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/aps/${apSerialNumber}`;
    // Empty payload for direct method
  } else {
    // Method 2: AP update with group assignment - get current AP details first
    const currentAp = await getApDetailsBySerial(token, apSerialNumber, region);
    
    apiUrl = region && region.trim() !== ''
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}`
      : `https://api.ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}`;
    
    // Use complete payload with all current properties preserved
    payload = {
      apGroupId: apGroupId,
      name: apName || currentAp.name,
      serialNumber: apSerialNumber,
      // Preserve other important properties
      ...(currentAp.description && { description: currentAp.description }),
      ...(description && { description }) // Override with new description if provided
    };
  }

  const response = await makeRuckusApiCall({
    method: 'put',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Move AP');

  const moveResponse = response.data;
  
  // Check if this is an async operation (has requestId)
  const activityId = moveResponse.requestId;
  
  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...moveResponse,
      status: 'completed',
      message: 'AP moved successfully (synchronous operation)'
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
            ...moveResponse,
            activityDetails,
            status: 'completed',
            message: 'AP moved successfully'
          };
        } else {
          return {
            ...moveResponse,
            activityDetails,
            status: 'failed',
            message: 'AP move failed',
            error: activityDetails.error || activityDetails.message || 'Operation completed with non-SUCCESS status'
          };
        }
      }

      if (isFailed) {
        return {
          ...moveResponse,
          activityDetails,
          status: 'failed',
          message: 'AP move failed',
          error: activityDetails.error || activityDetails.message || 'Unknown error'
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(`[RUCKUS] AP move in progress, attempt ${retryCount}/${maxRetries}`);
      
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
          ...moveResponse,
          status: 'timeout',
          message: 'AP move status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...moveResponse,
    status: 'timeout',
    message: 'AP move status unknown - polling timeout',
    activityId
  };
}

export async function queryDirectoryServerProfiles(
  token: string,
  region: string = '',
  filters: any = {},
  fields: string[] = ['id', 'name', 'domainName', 'host', 'port', 'type', 'wifiNetworkIds'],
  searchString: string = '',
  searchTargetFields: string[] = ['name'],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = 'name',
  sortOrder: string = 'ASC'
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/query`
    : 'https://api.ruckus.cloud/directoryServerProfiles/query';

  const payload = {
    fields,
    searchString,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField,
    sortOrder,
    searchTargetFields
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query directory server profiles');

  return response.data;
}

export async function getDirectoryServerProfile(
  token: string,
  profileId: string,
  region: string = ''
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/${profileId}`
    : `https://api.ruckus.cloud/directoryServerProfiles/${profileId}`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get directory server profile');

  return response.data;
}

export async function createDirectoryServerProfileWithRetry(
  token: string,
  profileData: {
    name: string;
    type: string;
    tlsEnabled: boolean;
    host: string;
    port: number;
    domainName: string;
    adminDomainName: string;
    adminPassword: string;
    identityName: string;
    identityEmail: string;
    identityPhone: string;
    keyAttribute: string;
    searchFilter?: string;
    attributeMappings: Array<{
      name: string;
      mappedByName: string;
    }>;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/directoryServerProfiles`
    : 'https://api.ruckus.cloud/directoryServerProfiles';

  const payload = {
    name: profileData.name,
    type: profileData.type,
    tlsEnabled: profileData.tlsEnabled,
    host: profileData.host,
    port: profileData.port,
    domainName: profileData.domainName,
    adminDomainName: profileData.adminDomainName,
    adminPassword: profileData.adminPassword,
    identityName: profileData.identityName,
    identityEmail: profileData.identityEmail,
    identityPhone: profileData.identityPhone,
    keyAttribute: profileData.keyAttribute,
    searchFilter: profileData.searchFilter || '',
    attributeMappings: profileData.attributeMappings
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Create directory server profile');

  const createResponse = response.data;
  
  const activityId = createResponse.requestId;
  
  if (!activityId) {
    return {
      ...createResponse,
      status: 'completed',
      message: 'Directory server profile created successfully (synchronous operation)'
    };
  }

  console.log(`Starting directory server profile creation status polling for activity ${activityId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxRetries} for directory server profile creation activity ${activityId}`);
    
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`Activity status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        return {
          ...createResponse,
          status: 'completed',
          message: 'Directory server profile created successfully',
          activityDetails
        };
      } else if (activityDetails.status === 'FAILED') {
        return {
          ...createResponse,
          status: 'failed',
          message: 'Directory server profile creation failed',
          error: activityDetails.error || 'Unknown error occurred',
          activityDetails
        };
      }
      
      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: 'timeout',
          message: 'Directory server profile creation status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(`Error polling directory server profile creation activity (attempt ${attempt}):`, error.message);
      
      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: 'timeout',
          message: 'Directory server profile creation status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: 'timeout',
    message: 'Directory server profile creation status unknown - polling timeout',
    activityId
  };
}

export async function updateDirectoryServerProfileWithRetry(
  token: string,
  profileId: string,
  profileData: {
    name: string;
    type: string;
    tlsEnabled: boolean;
    host: string;
    port: number;
    domainName: string;
    adminDomainName: string;
    adminPassword: string;
    identityName: string;
    identityEmail: string;
    identityPhone: string;
    keyAttribute: string;
    searchFilter?: string;
    attributeMappings: Array<{
      name: string;
      mappedByName: string;
    }>;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/${profileId}`
    : `https://api.ruckus.cloud/directoryServerProfiles/${profileId}`;

  const payload = {
    name: profileData.name,
    type: profileData.type,
    tlsEnabled: profileData.tlsEnabled,
    host: profileData.host,
    port: profileData.port,
    domainName: profileData.domainName,
    adminDomainName: profileData.adminDomainName,
    adminPassword: profileData.adminPassword,
    identityName: profileData.identityName,
    identityEmail: profileData.identityEmail,
    identityPhone: profileData.identityPhone,
    id: profileId,
    keyAttribute: profileData.keyAttribute,
    searchFilter: profileData.searchFilter || '',
    attributeMappings: profileData.attributeMappings
  };

  const response = await makeRuckusApiCall({
    method: 'put',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Update directory server profile');

  const updateResponse = response.data;
  
  const activityId = updateResponse.requestId;
  
  if (!activityId) {
    return {
      ...updateResponse,
      status: 'completed',
      message: 'Directory server profile updated successfully (synchronous operation)'
    };
  }

  console.log(`Starting directory server profile update status polling for activity ${activityId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxRetries} for directory server profile update activity ${activityId}`);
    
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`Activity status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        return {
          ...updateResponse,
          status: 'completed',
          message: 'Directory server profile updated successfully',
          activityDetails
        };
      } else if (activityDetails.status === 'FAILED') {
        return {
          ...updateResponse,
          status: 'failed',
          message: 'Directory server profile update failed',
          error: activityDetails.error || 'Unknown error occurred',
          activityDetails
        };
      }
      
      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: 'timeout',
          message: 'Directory server profile update status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(`Error polling directory server profile update activity (attempt ${attempt}):`, error.message);
      
      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: 'timeout',
          message: 'Directory server profile update status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...updateResponse,
    status: 'timeout',
    message: 'Directory server profile update status unknown - polling timeout',
    activityId
  };
}

export async function deleteDirectoryServerProfileWithRetry(
  token: string,
  profileId: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/${profileId}`
    : `https://api.ruckus.cloud/directoryServerProfiles/${profileId}`;

  const response = await makeRuckusApiCall({
    method: 'delete',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Delete directory server profile');

  const deleteResponse = response.data;
  
  const activityId = deleteResponse.requestId;
  
  if (!activityId) {
    return {
      ...deleteResponse,
      status: 'completed',
      message: 'Directory server profile deleted successfully (synchronous operation)'
    };
  }

  console.log(`Starting directory server profile deletion status polling for activity ${activityId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxRetries} for directory server profile deletion activity ${activityId}`);
    
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`Activity status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        return {
          ...deleteResponse,
          status: 'completed',
          message: 'Directory server profile deleted successfully',
          activityDetails
        };
      } else if (activityDetails.status === 'FAILED') {
        return {
          ...deleteResponse,
          status: 'failed',
          message: 'Directory server profile deletion failed',
          error: activityDetails.error || 'Unknown error occurred',
          activityDetails
        };
      }
      
      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: 'timeout',
          message: 'Directory server profile deletion status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(`Error polling directory server profile deletion activity (attempt ${attempt}):`, error.message);
      
      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: 'timeout',
          message: 'Directory server profile deletion status unknown - polling timeout',
          error: 'Failed to get activity status after maximum retries'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: 'timeout',
    message: 'Directory server profile deletion status unknown - polling timeout',
    activityId
  };
}

export async function queryPortalServiceProfiles(
  token: string,
  region: string = '',
  filters: any = {},
  searchString: string = '',
  searchTargetFields: string[] = ['name'],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = 'name',
  sortOrder: string = 'ASC'
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/portalServiceProfiles/query`
    : 'https://api.ruckus.cloud/portalServiceProfiles/query';

  const payload = {
    filters,
    page,
    pageSize,
    sortField,
    sortOrder,
    searchTargetFields,
    searchString
  };

  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query portal service profiles');

  return response.data;
}

export async function getPortalServiceProfile(
  token: string,
  profileId: string,
  region: string = ''
): Promise<any> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/portalServiceProfiles/${profileId}`
    : `https://api.ruckus.cloud/portalServiceProfiles/${profileId}`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url: apiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get portal service profile');

  return response.data;
}

export async function queryPrivilegeGroups(
  token: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/roleAuthentications/privilegeGroups`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query privilege groups');

  return response.data;
}

// Helper function to resolve privilege group name to ID
async function resolvePrivilegeGroupId(token: string, nameOrId: string, region: string = ''): Promise<string> {
  // If it looks like a UUID, assume it's already an ID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return nameOrId;
  }
  
  // Otherwise, resolve name to ID
  const groups = await queryPrivilegeGroups(token, region);
  const group = groups.find((g: any) => g.name === nameOrId);
  
  if (!group) {
    throw new Error(`Privilege group '${nameOrId}' not found. Available groups: ${groups.map((g: any) => g.name).join(', ')}`);
  }
  
  return group.id;
}

// Helper function to get venues
async function getRuckusVenues(token: string, region: string = ''): Promise<any[]> {
  const apiUrl = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/venues/query`
    : 'https://api.ruckus.cloud/venues/query';
    
  const payload = {
    fields: ["id", "name"],
    searchTargetFields: ["name", "addressLine", "description", "tagList"],
    filters: {},
    sortField: "name",
    sortOrder: "ASC",
    page: 1,
    pageSize: 10000,
    defaultPageSize: 10,
    total: 0
  };
  
  const response = await makeRuckusApiCall({
    method: 'post',
    url: apiUrl,
    data: payload,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Get venues');
  
  return response.data.data || [];
}

// Helper function to resolve venue names to IDs
async function resolveVenueIds(token: string, venueNames: string[], region: string = ''): Promise<string[]> {
  const venues = await getRuckusVenues(token, region);
  const venueIds: string[] = [];
  
  for (const nameOrId of venueNames) {
    // If it looks like a UUID, assume it's already an ID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
      venueIds.push(nameOrId);
      continue;
    }
    
    // Otherwise, resolve name to ID
    const venue = venues.find((v: any) => v.name === nameOrId);
    if (!venue) {
      throw new Error(`Venue '${nameOrId}' not found. Available venues: ${venues.map((v: any) => v.name).join(', ')}`);
    }
    venueIds.push(venue.id);
  }
  
  return venueIds;
}

export async function updatePrivilegeGroupWithRetry(
  token: string,
  privilegeGroupId: string,
  privilegeGroupData: {
    name: string;
    roleName: string;
    delegation: boolean;
    policies?: Array<{
      entityInstanceId: string;
      objectType: string;
    }>;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/roleAuthentications/privilegeGroups/${privilegeGroupId}`;

  const response = await makeRuckusApiCall({
    method: 'put',
    url,
    data: privilegeGroupData,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Update privilege group');

  const operationResponse = response.data;
  
  const activityId = operationResponse.requestId;
  
  if (!activityId) {
    return {
      ...operationResponse,
      status: 'completed',
      message: 'Operation completed successfully (synchronous operation)'
    };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`[${attempt + 1}/${maxRetries}] Polling activity status for requestId: ${activityId}`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`Activity status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        return {
          ...operationResponse,
          ...activityDetails,
          status: 'completed',
          message: 'Privilege group updated successfully'
        };
      }
      
      if (activityDetails.status === 'FAILED') {
        throw new Error(`Update privilege group failed: ${activityDetails.errorMessage || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries - 1) {
        return {
          ...operationResponse,
          status: 'timeout',
          message: `Update privilege group status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
          activityId
        };
      }
    }
  }

  return {
    ...operationResponse,
    status: 'timeout',
    message: `Update privilege group status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
    activityId
  };
}

export async function updatePrivilegeGroupSimple(
  token: string,
  privilegeGroupName: string,
  name: string,
  roleName: string,
  delegation: boolean,
  allVenues: boolean = true,
  venueNames: string[] = [],
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  // Resolve group name to ID
  const privilegeGroupId = await resolvePrivilegeGroupId(token, privilegeGroupName, region);
  
  // Build the privilege group data
  const privilegeGroupData: any = {
    name,
    roleName,
    delegation
  };
  
  // If not all venues, build policies from venue names
  if (!allVenues && venueNames.length > 0) {
    const venueIds = await resolveVenueIds(token, venueNames, region);
    privilegeGroupData.policies = venueIds.map(venueId => ({
      entityInstanceId: venueId,
      objectType: 'com.ruckus.cloud.venue.model.venue'
    }));
  }
  
  // Call the existing function
  return await updatePrivilegeGroupWithRetry(
    token,
    privilegeGroupId,
    privilegeGroupData,
    region,
    maxRetries,
    pollIntervalMs
  );
}

export async function queryCustomRoles(
  token: string,
  region: string = ''
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/roleAuthentications/customRoles`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query custom roles');

  return response.data;
}

export async function updateCustomRoleWithRetry(
  token: string,
  roleId: string,
  roleData: {
    name: string;
    features: string[];
    preDefinedRole?: string;
  },
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/roleAuthentications/customRoles/${roleId}`;

  const response = await makeRuckusApiCall({
    method: 'put',
    url,
    data: roleData,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Update custom role');

  const operationResponse = response.data;
  
  const activityId = operationResponse.requestId;
  
  if (!activityId) {
    return {
      ...operationResponse,
      status: 'completed',
      message: 'Operation completed successfully (synchronous operation)'
    };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`[${attempt + 1}/${maxRetries}] Polling activity status for requestId: ${activityId}`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      console.log(`Activity status: ${activityDetails.status}`);
      
      if (activityDetails.status === 'COMPLETED') {
        return {
          ...operationResponse,
          ...activityDetails,
          status: 'completed',
          message: 'Custom role updated successfully'
        };
      }
      
      if (activityDetails.status === 'FAILED') {
        throw new Error(`Update custom role failed: ${activityDetails.errorMessage || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries - 1) {
        return {
          ...operationResponse,
          status: 'timeout',
          message: `Update custom role status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
          activityId
        };
      }
    }
  }

  return {
    ...operationResponse,
    status: 'timeout',
    message: `Update custom role status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
    activityId
  };
}

export async function queryRoleFeatures(
  token: string,
  region: string = '',
  showScopes: boolean = false,
  category: string = '',
  searchString: string = '',
  page: number = 1,
  pageSize: number = 100
): Promise<any> {
  const url = `https://api.${region ? region + '.' : ''}ruckus.cloud/roleAuthentications/features?showScopes=${showScopes}`;

  const response = await makeRuckusApiCall({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Query role features');

  let features = response.data;

  // Flatten nested features for easier searching
  const flattenFeatures = (items: any[], result: any[] = []): any[] => {
    for (const item of items) {
      result.push({
        name: item.name,
        description: item.description,
        category: item.category
      });
      if (item.subFeatures) {
        flattenFeatures(item.subFeatures, result);
      }
    }
    return result;
  };

  features = flattenFeatures(features);

  // Apply category filtering
  if (category && category.trim() !== '') {
    features = features.filter((feature: any) => 
      feature.category && feature.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Apply search filtering
  if (searchString && searchString.trim() !== '') {
    const search = searchString.toLowerCase();
    features = features.filter((feature: any) => 
      (feature.name && feature.name.toLowerCase().includes(search)) ||
      (feature.description && feature.description.toLowerCase().includes(search))
    );
  }

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFeatures = features.slice(startIndex, endIndex);

  return {
    data: paginatedFeatures,
    pagination: {
      page,
      pageSize,
      total: features.length,
      totalPages: Math.ceil(features.length / pageSize)
    }
  };
}

export async function createCustomRole(
  token: string,
  name: string,
  features: string[],
  region: string = '',
  preDefinedRole: string = 'READ_ONLY'
): Promise<any> {
  const originalFeatures = [...features];
  const enhancedFeatures = [...features];
  const addedPermissions: string[] = [];
  
  // Map of permission prefixes to their required parent read permission
  const parentMap: Record<string, string> = {
    'wifi.': 'wifi-r',
    'switch.': 'switch-r', 
    'edge.': 'edge-r',
    'ai.': 'ai-r',
    'admin.': 'admin-r'
  };
  
  // Check each feature for advanced permissions and add parent if missing
  for (const feature of features) {
    // Check for advanced permissions (e.g., wifi.venue-c)
    for (const [prefix, parent] of Object.entries(parentMap)) {
      if (feature.startsWith(prefix) && !enhancedFeatures.includes(parent)) {
        enhancedFeatures.push(parent);
        addedPermissions.push(parent);
        console.log(`[MCP] Auto-adding ${parent} as parent permission for ${feature}`);
      }
    }
    
    // Check for category-wide permissions (e.g., wifi-c, wifi-u, wifi-d)
    const categoryMatch = feature.match(/^(wifi|switch|edge|ai|admin)-[cud]$/);
    if (categoryMatch) {
      const readPerm = `${categoryMatch[1]}-r`;
      if (!enhancedFeatures.includes(readPerm)) {
        enhancedFeatures.push(readPerm);
        addedPermissions.push(readPerm);
        console.log(`[MCP] Auto-adding ${readPerm} as base permission for ${feature}`);
      }
    }
  }
  
  const finalRoleData = {
    name,
    features: [...new Set(enhancedFeatures)], // Remove duplicates
    preDefinedRole
  };
  
  const url = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/roleAuthentications/customRoles`
    : 'https://api.ruckus.cloud/roleAuthentications/customRoles';

  const response = await makeRuckusApiCall({
    method: 'post',
    url,
    data: finalRoleData,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Create custom role');

  // Enhance response with metadata about auto-added permissions
  return {
    ...response.data,
    _mcp_metadata: {
      originalFeatures,
      autoAddedPermissions: addedPermissions,
      finalFeatures: finalRoleData.features,
      message: addedPermissions.length > 0 
        ? `Auto-added parent permissions: ${addedPermissions.join(', ')}` 
        : 'No additional permissions needed'
    }
  };
}

export async function deleteCustomRoleWithRetry(
  token: string,
  roleId: string,
  region: string = '',
  maxRetries: number = 5,
  pollIntervalMs: number = 2000
): Promise<any> {
  const url = region && region.trim() !== ''
    ? `https://api.${region}.ruckus.cloud/roleAuthentications/customRoles/${roleId}`
    : `https://api.ruckus.cloud/roleAuthentications/customRoles/${roleId}`;

  const response = await makeRuckusApiCall({
    method: 'delete',
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, 'Delete custom role');

  const deleteResponse = response.data;
  
  const activityId = deleteResponse.requestId;
  
  if (!activityId) {
    return {
      ...deleteResponse,
      status: 'completed',
      message: 'Custom role deleted successfully (synchronous operation)'
    };
  }

  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(token, activityId, region);
      
      const isCompleted = activityDetails.endDatetime !== undefined;
      
      const isFailed = 
        activityDetails.status !== 'SUCCESS' && 
        activityDetails.status !== 'INPROGRESS';

      if (isCompleted) {
        if (activityDetails.status === 'SUCCESS') {
          return {
            ...deleteResponse,
            activityDetails,
            status: 'completed',
            message: 'Custom role deleted successfully'
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: 'failed',
            message: 'Custom role deletion failed',
            error: activityDetails.error || activityDetails.message || 'Operation completed with non-SUCCESS status'
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: 'failed',
          message: 'Custom role deletion failed',
          error: activityDetails.error || activityDetails.message || 'Operation failed with non-SUCCESS status'
        };
      }

      console.log(`[${retryCount + 1}/${maxRetries}] Activity in progress, polling again after ${pollIntervalMs}ms...`);
    } catch (pollError) {
      console.error(`Polling error: ${pollError}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    retryCount++;
  }

  return {
    ...deleteResponse,
    status: 'timeout',
    message: `Custom role deletion status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
    activityId
  };
}

