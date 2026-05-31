import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { AuthTokenResponse } from "../types/ruckusApi";
import { applyMergePatch } from "../utils/mergePatch";

// Captive-portal sub-types — the MCP `type` enum value → the wire
// `guestNetworkType` string the R1 API expects. All sub-types serialize to
// nwSubType=guest at the top level; the discriminator lives in
// guestPortal.guestNetworkType. Single source of truth — keep in sync with
// the `type` enum in src/mcpServer.ts (create_wifi_network).
const PORTAL_TYPE_TO_WIRE: Record<string, string> = {
  guestPass: "GuestPass",
  clickThrough: "ClickThrough",
  selfSignIn: "SelfSignIn",
  hostApproval: "HostApproval",
  cloudpath: "Cloudpath",
  wispr: "WISPr",
  directory: "Directory",
  saml: "SAML",
  workflow: "Workflow",
};

async function makeRuckusApiCall<T = any>(
  config: AxiosRequestConfig,
  operationName: string,
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
        if (
          error.response.data.errors &&
          Array.isArray(error.response.data.errors)
        ) {
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
      detailedError.name = "RuckusApiError";
      throw detailedError;
    }
    throw error;
  }
}

export async function getRuckusJwtToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
  region: string = "",
): Promise<AuthTokenResponse> {
  const url = `https://${region ? region + "." : ""}ruckus.cloud/oauth2/token/${tenantId}`;
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url,
      data: params,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    },
    "OAuth token request",
  );

  return response.data;
}

export async function getRuckusActivityDetails(
  token: string,
  activityId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/activities/${activityId}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get activity details",
  );

  return response.data;
}

export async function getVenueExternalAntennaSettings(
  token: string,
  venueId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apModelExternalAntennaSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get venue external antenna settings",
  );

  return response.data;
}

export async function getVenueAntennaTypeSettings(
  token: string,
  venueId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apModelAntennaTypeSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get venue antenna type settings",
  );

  return response.data;
}

export async function getApGroupExternalAntennaSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apModelExternalAntennaSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP group external antenna settings",
  );

  return response.data;
}

export async function getApGroupAntennaTypeSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apModelAntennaTypeSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP group antenna type settings",
  );

  return response.data;
}

export async function getVenueApModelBandModeSettings(
  token: string,
  venueId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apModelBandModeSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get venue AP model band mode settings",
  );

  return response.data;
}

export async function getVenueRadioSettings(
  token: string,
  venueId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apRadioSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get venue radio settings",
  );

  return response.data;
}

export async function getApGroupApModelBandModeSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apModelBandModeSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP group AP model band mode settings",
  );

  return response.data;
}

export async function getApGroupRadioSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/radioSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP group radio settings",
  );

  return response.data;
}

export async function getApRadioSettings(
  token: string,
  venueId: string,
  apSerialNumber: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}/radioSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP radio settings",
  );

  return response.data;
}

export async function getApPassword(
  token: string,
  venueId: string,
  apSerial: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/aps/${apSerial}/passwords`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP password",
  );

  return response.data;
}

export async function getApClientAdmissionControlSettings(
  token: string,
  venueId: string,
  apSerialNumber: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}/clientAdmissionControlSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP client admission control settings",
  );

  return response.data;
}

export async function getApGroupClientAdmissionControlSettings(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/apClientAdmissionControlSettings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get AP group client admission control settings",
  );

  return response.data;
}

export async function deleteVenueWithRetry(
  token: string,
  venueId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}`
      : `https://api.ruckus.cloud/venues/${venueId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete venue",
  );

  const deleteResponse = response.data;

  // Always get requestId for async tracking (delete operations always return requestId)
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    throw new Error("No requestId returned from venue deletion API");
  }

  // Poll for completion status
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...deleteResponse,
            activityDetails,
            status: "completed",
            message: "Venue deleted successfully",
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: "failed",
            message: "Venue deletion failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: "failed",
          message: "Venue deletion failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] Venue deletion in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message: "Venue deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "Venue deletion status unknown - polling timeout",
    activityId,
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues`
      : "https://api.ruckus.cloud/venues";

  const payload = {
    name: venueData.name,
    address: {
      addressLine: venueData.addressLine,
      city: venueData.city,
      country: venueData.country,
      ...(venueData.latitude !== undefined && { latitude: venueData.latitude }),
      ...(venueData.longitude !== undefined && {
        longitude: venueData.longitude,
      }),
      ...(venueData.timezone && { timezone: venueData.timezone }),
    },
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create venue",
  );

  const createResponse = response.data;

  // Always get requestId for async tracking (create operations always return requestId)
  const activityId = createResponse.requestId;

  if (!activityId) {
    throw new Error("No requestId returned from venue creation API");
  }

  // Poll for completion status
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...createResponse,
            activityDetails,
            status: "completed",
            message: "Venue created successfully",
          };
        } else {
          return {
            ...createResponse,
            activityDetails,
            status: "failed",
            message: "Venue creation failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...createResponse,
          activityDetails,
          status: "failed",
          message: "Venue creation failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] Venue creation in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message: "Venue creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "Venue creation status unknown - polling timeout",
    activityId,
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}`
      : `https://api.ruckus.cloud/venues/${venueId}`;

  const payload = {
    name: venueData.name,
    ...(venueData.description !== undefined && {
      description: venueData.description,
    }),
    address: {
      addressLine: venueData.addressLine,
      city: venueData.city,
      country: venueData.country,
      ...(venueData.countryCode && { countryCode: venueData.countryCode }),
      ...(venueData.latitude !== undefined && { latitude: venueData.latitude }),
      ...(venueData.longitude !== undefined && {
        longitude: venueData.longitude,
      }),
      ...(venueData.timezone && { timezone: venueData.timezone }),
    },
  };

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Update venue",
  );

  const updateResponse = response.data;

  const activityId = updateResponse.requestId;

  if (!activityId) {
    return {
      ...updateResponse,
      status: "completed",
      message: "Venue updated successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting venue update status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for venue update activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...updateResponse,
          status: "completed",
          message: "Venue updated successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...updateResponse,
          status: "failed",
          message: "Venue update failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: "timeout",
          message: "Venue update status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling venue update activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: "timeout",
          message: "Venue update status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...updateResponse,
    status: "timeout",
    message: "Venue update status unknown - polling timeout",
    activityId,
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups`
      : `https://api.ruckus.cloud/venues/${venueId}/apGroups`;

  const payload = {
    name: apGroupData.name,
    venueId: venueId,
    apSerialNumbers: apGroupData.apSerialNumbers || [],
    ...(apGroupData.description && { description: apGroupData.description }),
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create AP group",
  );

  const createResponse = response.data;

  // Check if this is an async operation (has requestId)
  const activityId = createResponse.requestId;

  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...createResponse,
      status: "completed",
      message: "AP group created successfully (synchronous operation)",
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...createResponse,
            activityDetails,
            status: "completed",
            message: "AP group created successfully",
          };
        } else {
          return {
            ...createResponse,
            activityDetails,
            status: "failed",
            message: "AP group creation failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...createResponse,
          activityDetails,
          status: "failed",
          message: "AP group creation failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] AP group creation in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message: "AP group creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "AP group creation status unknown - polling timeout",
    activityId,
  };
}

export async function addApToGroupWithRetry(
  token: string,
  venueId: string,
  apGroupId: string,
  apData: {
    name: string;
    serialNumber: string;
    description?: string;
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/aps`
      : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/aps`;

  const payload = {
    name: apData.name,
    serialNumber: apData.serialNumber,
    ...(apData.description !== undefined && {
      description: apData.description || "",
    }),
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Add AP to group",
  );

  const addResponse = response.data;

  // Check if this is an async operation (has requestId)
  const activityId = addResponse.requestId;

  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...addResponse,
      status: "completed",
      message: "AP added to group successfully (synchronous operation)",
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...addResponse,
            activityDetails,
            status: "completed",
            message: "AP added to group successfully",
          };
        } else {
          return {
            ...addResponse,
            activityDetails,
            status: "failed",
            message: "AP addition to group failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...addResponse,
          activityDetails,
          status: "failed",
          message: "AP addition to group failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] AP addition to group in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...addResponse,
          status: "timeout",
          message: "AP addition to group status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...addResponse,
    status: "timeout",
    message: "AP addition to group status unknown - polling timeout",
    activityId,
  };
}

/**
 * Get AP group details including the list of APs currently in the group.
 * Used by updateApGroupWithRetry to preserve existing APs during updates.
 */
export async function getApGroupDetails(
  token: string,
  apGroupId: string,
  region: string = "",
): Promise<{ apSerialNumbers: Array<{ serialNumber: string }> }> {
  // Query APs filtered by apGroupId to get serial numbers
  const apsResult = await queryAPs(
    token,
    region,
    { apGroupId: [apGroupId] },
    ["serialNumber"],
    "",
    [],
    1,
    10000, // Get all APs in group
  );

  const apSerialNumbers =
    apsResult.data?.map((ap: any) => ({
      serialNumber: ap.serialNumber,
    })) || [];

  console.log(
    `[RUCKUS] Retrieved ${apSerialNumbers.length} APs from AP group ${apGroupId}`,
  );

  return { apSerialNumbers };
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
  preserveExistingAps: boolean = true,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`
      : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`;

  // Step 0: Retrieve existing APs if not provided and preservation is enabled
  let effectiveApSerialNumbers = apGroupData.apSerialNumbers;

  if (effectiveApSerialNumbers === undefined && preserveExistingAps) {
    console.log(
      "[RUCKUS] Retrieving existing APs to preserve during update...",
    );
    const existingData = await getApGroupDetails(token, apGroupId, region);
    effectiveApSerialNumbers = existingData.apSerialNumbers;
    console.log(
      `[RUCKUS] Found ${effectiveApSerialNumbers.length} existing APs to preserve`,
    );
  }

  // Convert from Array<{ serialNumber: string }> to string[] for API
  const serialNumbersArray = (effectiveApSerialNumbers || []).map(
    (ap) => ap.serialNumber,
  );

  const payload = {
    name: apGroupData.name,
    venueId: venueId,
    ...(apGroupData.description !== undefined && {
      description: apGroupData.description,
    }),
    apSerialNumbers: serialNumbersArray,
  };

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Update AP group",
  );

  const updateResponse = response.data;

  const activityId = updateResponse.requestId;

  if (!activityId) {
    return {
      ...updateResponse,
      status: "completed",
      message: "AP group updated successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting AP group update status polling for activity ${activityId}`,
  );
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(
        `[RUCKUS] AP group update activity ${activityId} status: ${activityDetails.status}`,
      );

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        console.log(
          `[RUCKUS] AP group updated successfully after ${retryCount + 1} attempts`,
        );
        return {
          ...updateResponse,
          status: "completed",
          message: "AP group updated successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        console.error(`[RUCKUS] AP group update failed:`, activityDetails);
        return {
          ...updateResponse,
          status: "failed",
          message: "AP group update failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      retryCount++;
      console.log(
        `[RUCKUS] AP group update in progress, attempt ${retryCount}/${maxRetries}`,
      );

      if (retryCount >= maxRetries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      if (retryCount >= maxRetries) {
        return {
          ...updateResponse,
          status: "timeout",
          message: "AP group update status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...updateResponse,
    status: "timeout",
    message: "AP group update status unknown - polling timeout",
    activityId,
  };
}

export async function queryApGroups(
  token: string,
  region: string = "",
  filters: any = {},
  fields: string[] = ["id", "name"],
  page: number = 1,
  pageSize: number = 10000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/apGroups/query`
      : "https://api.ruckus.cloud/venues/apGroups/query";

  const payload = {
    fields,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField: "name",
    sortOrder: "ASC",
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query AP groups",
  );

  return response.data;
}

export async function queryAPs(
  token: string,
  region: string = "",
  filters: any = {},
  fields: string[] = [
    "name",
    "status",
    "model",
    "networkStatus",
    "macAddress",
    "venueName",
    "switchName",
    "meshRole",
    "clientCount",
    "apWiredClientCount",
    "apGroupId",
    "apGroupName",
    "lanPortStatuses",
    "tags",
    "serialNumber",
    "radioStatuses",
    "venueId",
    "poePort",
    "firmwareVersion",
    "uptime",
    "afcStatus",
    "powerSavingStatus",
    "supportSecureBoot",
    "poeUnderPowered",
  ],
  searchString: string = "",
  searchTargetFields: string[] = [
    "name",
    "model",
    "networkStatus.ipAddress",
    "macAddress",
    "tags",
    "serialNumber",
  ],
  page: number = 1,
  pageSize: number = 10,
  mesh: boolean = false,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/aps/query${mesh ? "?mesh=true" : ""}`
      : `https://api.ruckus.cloud/venues/aps/query${mesh ? "?mesh=true" : ""}`;

  const payload = {
    searchString,
    searchTargetFields,
    fields,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField: "name",
    sortOrder: "ASC",
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query APs",
  );

  return response.data;
}

export async function deleteApGroupWithRetry(
  token: string,
  venueId: string,
  apGroupId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`
      : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete AP group",
  );

  const deleteResponse = response.data;

  // Check if this is an async operation (has requestId)
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...deleteResponse,
      status: "completed",
      message: "AP group deleted successfully (synchronous operation)",
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...deleteResponse,
            activityDetails,
            status: "completed",
            message: "AP group deleted successfully",
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: "failed",
            message: "AP group deletion failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: "failed",
          message: "AP group deletion failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] AP group deletion in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message: "AP group deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "AP group deletion status unknown - polling timeout",
    activityId,
  };
}

export async function removeApWithRetry(
  token: string,
  venueId: string,
  apSerialNumber: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}`
      : `https://api.ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Remove AP",
  );

  const deleteResponse = response.data;

  // Check if this is an async operation (has requestId)
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...deleteResponse,
      status: "completed",
      message: "AP removed successfully (synchronous operation)",
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...deleteResponse,
            activityDetails,
            status: "completed",
            message: "AP removed successfully",
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: "failed",
            message: "AP removal failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: "failed",
          message: "AP removal failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] AP removal in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message: "AP removal status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "AP removal status unknown - polling timeout",
    activityId,
  };
}

export async function getApDetailsBySerial(
  token: string,
  serialNumber: string,
  region: string = "",
): Promise<any> {
  const response = await queryAPs(
    token,
    region,
    {},
    [
      "name",
      "status",
      "model",
      "networkStatus",
      "macAddress",
      "venueName",
      "switchName",
      "meshRole",
      "clientCount",
      "apWiredClientCount",
      "apGroupId",
      "apGroupName",
      "lanPortStatuses",
      "tags",
      "serialNumber",
      "radioStatuses",
      "venueId",
      "poePort",
      "firmwareVersion",
      "uptime",
      "afcStatus",
      "powerSavingStatus",
      "supportSecureBoot",
      "poeUnderPowered",
    ],
    serialNumber,
    ["serialNumber"],
    1,
    10,
  );

  if (response.totalCount === 0) {
    throw new Error(`AP with serial number ${serialNumber} not found`);
  }

  return response.data[0];
}

export async function updateApWithRetrieval(
  token: string,
  serialNumber: string,
  changes?: {
    name?: string;
    venueId?: string;
    apGroupId?: string;
    description?: string;
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  // Step 1: Get current AP state
  const currentAp = await getApDetailsBySerial(token, serialNumber, region);

  // Step 2: Determine target venue (either new venue or current venue)
  const targetVenueId = changes?.venueId ?? currentAp.venueId;
  const targetApGroupId = changes?.apGroupId ?? currentAp.apGroupId;
  const targetName = changes?.name ?? currentAp.name;

  // Step 3: Detect if this is a move operation or just a property update
  const isMovingVenue =
    changes?.venueId && changes.venueId !== currentAp.venueId;
  const isMovingGroup =
    changes?.apGroupId && changes.apGroupId !== currentAp.apGroupId;
  const isMoving = isMovingVenue || isMovingGroup;

  // Step 4: Choose appropriate method
  // - Use 'direct' for venue/group moves (group assignment endpoint)
  // - Use 'update' for property changes only (name/description)
  const method = isMoving ? "direct" : "update";

  return await moveApWithRetry(
    token,
    targetVenueId,
    serialNumber,
    targetApGroupId,
    targetName,
    changes?.description,
    method,
    region,
    maxRetries,
    pollIntervalMs,
  );
}

export async function moveApWithRetry(
  token: string,
  venueId: string,
  apSerialNumber: string,
  apGroupId: string,
  apName?: string,
  description?: string,
  method: "direct" | "update" = "update",
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  let apiUrl: string;
  let payload: any = {};

  if (method === "direct") {
    // Method 1: Direct group assignment
    apiUrl =
      region && region.trim() !== ""
        ? `https://api.${region}.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/aps/${apSerialNumber}`
        : `https://api.ruckus.cloud/venues/${venueId}/apGroups/${apGroupId}/aps/${apSerialNumber}`;
    // Empty payload for direct method
  } else {
    // Method 2: AP update with group assignment - get current AP details first
    const currentAp = await getApDetailsBySerial(token, apSerialNumber, region);

    apiUrl =
      region && region.trim() !== ""
        ? `https://api.${region}.ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}`
        : `https://api.ruckus.cloud/venues/${venueId}/aps/${apSerialNumber}`;

    // Use complete payload with all current properties preserved
    payload = {
      apGroupId: apGroupId,
      name: apName || currentAp.name,
      serialNumber: apSerialNumber,
      // Preserve other important properties
      ...(currentAp.description && { description: currentAp.description }),
      ...(description && { description }), // Override with new description if provided
    };
  }

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Move AP",
  );

  const moveResponse = response.data;

  // Check if this is an async operation (has requestId)
  const activityId = moveResponse.requestId;

  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...moveResponse,
      status: "completed",
      message: "AP moved successfully (synchronous operation)",
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...moveResponse,
            activityDetails,
            status: "completed",
            message: "AP moved successfully",
          };
        } else {
          return {
            ...moveResponse,
            activityDetails,
            status: "failed",
            message: "AP move failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...moveResponse,
          activityDetails,
          status: "failed",
          message: "AP move failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] AP move in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...moveResponse,
          status: "timeout",
          message: "AP move status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...moveResponse,
    status: "timeout",
    message: "AP move status unknown - polling timeout",
    activityId,
  };
}

export async function queryDirectoryServerProfiles(
  token: string,
  region: string = "",
  filters: any = {},
  fields: string[] = [
    "id",
    "name",
    "domainName",
    "host",
    "port",
    "type",
    "wifiNetworkIds",
  ],
  searchString: string = "",
  searchTargetFields: string[] = ["name"],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = "name",
  sortOrder: string = "ASC",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/query`
      : "https://api.ruckus.cloud/directoryServerProfiles/query";

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
    searchTargetFields,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query directory server profiles",
  );

  return response.data;
}

export async function getDirectoryServerProfile(
  token: string,
  profileId: string,
  region: string = "",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/${profileId}`
      : `https://api.ruckus.cloud/directoryServerProfiles/${profileId}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get directory server profile",
  );

  return response.data;
}

export async function queryRadiusServerProfiles(
  token: string,
  region: string = "",
  page: number = 1,
  pageSize: number = 10,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/radiusServerProfiles/query`
      : "https://api.ruckus.cloud/radiusServerProfiles/query";

  const payload = {
    page,
    pageSize,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query RADIUS server profiles",
  );

  return response.data;
}

export async function getRadiusServerProfile(
  token: string,
  profileId: string,
  region: string = "",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/radiusServerProfiles/${profileId}`
      : `https://api.ruckus.cloud/radiusServerProfiles/${profileId}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ruckus.v1.1+json",
        Accept: "application/vnd.ruckus.v1.1+json",
      },
    },
    "Get RADIUS server profile",
  );

  const profileData = response.data;

  // If hostname/ip not in response, extract from query API
  if (
    profileData.primary &&
    !profileData.primary.hostname &&
    !profileData.primary.ip
  ) {
    try {
      const queryResult = await queryRadiusServerProfiles(token, region);
      const match = queryResult.data?.find((p: any) => p.id === profileId);
      if (match?.primary && typeof match.primary === "string") {
        // Parse "hostname:port" or "ip:port" format
        const [hostOrIp] = match.primary.split(":");
        // Detect if IP (IPv4) or hostname
        const isIp =
          /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            hostOrIp,
          );
        profileData.primary[isIp ? "ip" : "hostname"] = hostOrIp;
      }
    } catch (error) {
      // If query fails, return profile without hostname/ip - don't fail the whole request
      console.error("Failed to extract hostname from query API:", error);
    }
  }

  // Same for secondary if present
  if (
    profileData.secondary &&
    !profileData.secondary.hostname &&
    !profileData.secondary.ip
  ) {
    try {
      const queryResult = await queryRadiusServerProfiles(token, region);
      const match = queryResult.data?.find((p: any) => p.id === profileId);
      if (
        match?.secondary &&
        typeof match.secondary === "string" &&
        match.secondary !== ""
      ) {
        const [hostOrIp] = match.secondary.split(":");
        const isIp =
          /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            hostOrIp,
          );
        profileData.secondary[isIp ? "ip" : "hostname"] = hostOrIp;
      }
    } catch (error) {
      console.error(
        "Failed to extract secondary hostname from query API:",
        error,
      );
    }
  }

  return profileData;
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/directoryServerProfiles`
      : "https://api.ruckus.cloud/directoryServerProfiles";

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
    searchFilter: profileData.searchFilter || "",
    attributeMappings: profileData.attributeMappings,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create directory server profile",
  );

  const createResponse = response.data;

  const activityId = createResponse.requestId;

  if (!activityId) {
    return {
      ...createResponse,
      status: "completed",
      message:
        "Directory server profile created successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting directory server profile creation status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for directory server profile creation activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...createResponse,
          status: "completed",
          message: "Directory server profile created successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...createResponse,
          status: "failed",
          message: "Directory server profile creation failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message:
            "Directory server profile creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling directory server profile creation activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message:
            "Directory server profile creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: "timeout",
    message:
      "Directory server profile creation status unknown - polling timeout",
    activityId,
  };
}

export async function createRadiusServerProfileWithRetry(
  token: string,
  profileData: {
    name: string;
    type: "AUTHENTICATION" | "ACCOUNTING";
    enableSecondaryServer: boolean;
    primary: {
      port: number;
      sharedSecret: string;
      hostname?: string;
      ip?: string;
    };
    secondary?: {
      port: number;
      sharedSecret: string;
      hostname?: string;
      ip?: string;
    };
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/radiusServerProfiles`
      : "https://api.ruckus.cloud/radiusServerProfiles";

  // Helper to detect if value is an IP address (IPv4 or IPv6) vs hostname/FQDN
  const isIpAddress = (value: string): boolean => {
    // IPv4 pattern
    const ipv4Pattern =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^[0-9a-fA-F:]+$/;
    return (
      ipv4Pattern.test(value) ||
      (value.includes(":") && ipv6Pattern.test(value))
    );
  };

  // Build primary server config with correct field (ip vs hostname)
  const primaryConfig: any = {
    port: profileData.primary.port,
    sharedSecret: profileData.primary.sharedSecret,
  };

  // If both ip AND hostname provided, send both (for mutual exclusivity testing)
  if (profileData.primary.ip && profileData.primary.hostname) {
    primaryConfig.ip = profileData.primary.ip;
    primaryConfig.hostname = profileData.primary.hostname;
  }
  // If only ip provided, use it directly
  else if (profileData.primary.ip) {
    primaryConfig.ip = profileData.primary.ip;
  }
  // If only hostname provided, use auto-detection (existing logic)
  else if (profileData.primary.hostname) {
    if (isIpAddress(profileData.primary.hostname)) {
      primaryConfig.ip = profileData.primary.hostname;
    } else {
      primaryConfig.hostname = profileData.primary.hostname;
    }
  }

  const payload: any = {
    name: profileData.name,
    type: profileData.type,
    enableSecondaryServer: profileData.enableSecondaryServer,
    primary: primaryConfig,
  };

  if (profileData.secondary) {
    const secondaryConfig: any = {
      port: profileData.secondary.port,
      sharedSecret: profileData.secondary.sharedSecret,
    };

    // If both ip AND hostname provided, send both (for mutual exclusivity testing)
    if (profileData.secondary.ip && profileData.secondary.hostname) {
      secondaryConfig.ip = profileData.secondary.ip;
      secondaryConfig.hostname = profileData.secondary.hostname;
    }
    // If only ip provided, use it directly
    else if (profileData.secondary.ip) {
      secondaryConfig.ip = profileData.secondary.ip;
    }
    // If only hostname provided, use auto-detection (existing logic)
    else if (profileData.secondary.hostname) {
      if (isIpAddress(profileData.secondary.hostname)) {
        secondaryConfig.ip = profileData.secondary.hostname;
      } else {
        secondaryConfig.hostname = profileData.secondary.hostname;
      }
    }
    payload.secondary = secondaryConfig;
  }

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ruckus.v1.1+json",
        Accept: "application/vnd.ruckus.v1.1+json",
      },
    },
    "Create RADIUS server profile",
  );

  const createResponse = response.data;

  const activityId = createResponse.requestId;

  if (!activityId) {
    return {
      ...createResponse,
      status: "completed",
      message:
        "RADIUS server profile created successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting RADIUS server profile creation status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for RADIUS server profile creation activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...createResponse,
          status: "completed",
          message: "RADIUS server profile created successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...createResponse,
          status: "failed",
          message: "RADIUS server profile creation failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message:
            "RADIUS server profile creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling RADIUS server profile creation activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message:
            "RADIUS server profile creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "RADIUS server profile creation status unknown - polling timeout",
    activityId,
  };
}

export async function updateDirectoryServerProfileWithRetry(
  token: string,
  profileId: string,
  profileConfig: any = {},
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  // STORY-023: config-driven retrieve-then-merge (generalizes update_wifi_network).
  // Caller passes a PARTIAL profile config; getDirectoryServerProfile + applyMergePatch
  // preserve unspecified fields. R1 returns adminPassword in GET (confirmed by trace),
  // so the secret survives the merge, and accepts the GET-shaped body verbatim on PUT.
  const baseApiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud`
      : "https://api.ruckus.cloud";

  return updateResourceWithMerge({
    token,
    id: profileId,
    partial: profileConfig,
    region,
    getFn: getDirectoryServerProfile,
    putUrl: `${baseApiUrl}/directoryServerProfiles/${profileId}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    resourceName: "directory_server_profile",
    maxRetries,
    pollIntervalMs,
  });
}

export async function deleteDirectoryServerProfileWithRetry(
  token: string,
  profileId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/directoryServerProfiles/${profileId}`
      : `https://api.ruckus.cloud/directoryServerProfiles/${profileId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete directory server profile",
  );

  const deleteResponse = response.data;

  const activityId = deleteResponse.requestId;

  if (!activityId) {
    return {
      ...deleteResponse,
      status: "completed",
      message:
        "Directory server profile deleted successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting directory server profile deletion status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for directory server profile deletion activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...deleteResponse,
          status: "completed",
          message: "Directory server profile deleted successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...deleteResponse,
          status: "failed",
          message: "Directory server profile deletion failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message:
            "Directory server profile deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling directory server profile deletion activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message:
            "Directory server profile deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message:
      "Directory server profile deletion status unknown - polling timeout",
    activityId,
  };
}

export async function deleteRadiusServerProfileWithRetry(
  token: string,
  profileId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/radiusServerProfiles/${profileId}`
      : `https://api.ruckus.cloud/radiusServerProfiles/${profileId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete RADIUS server profile",
  );

  const deleteResponse = response.data;

  const activityId = deleteResponse.requestId;

  if (!activityId) {
    return {
      ...deleteResponse,
      status: "completed",
      message:
        "RADIUS server profile deleted successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting RADIUS server profile deletion status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for RADIUS server profile deletion activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...deleteResponse,
          status: "completed",
          message: "RADIUS server profile deleted successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...deleteResponse,
          status: "failed",
          message: "RADIUS server profile deletion failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message:
            "RADIUS server profile deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling RADIUS server profile deletion activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message:
            "RADIUS server profile deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "RADIUS server profile deletion status unknown - polling timeout",
    activityId,
  };
}

/**
 * Consolidated polling over one or more async activity requestIds (STORY-023).
 * Returns `{ status: "completed" | "failed" | "timeout", message, activities, error? }`
 * — failed/timeout become `isError` at the handler boundary via `toolResult` (#106).
 * Generalizes the per-function polling loops (e.g. createWifiNetworkWithRetry).
 */
export async function pollActivities(
  token: string,
  region: string,
  requestIds: Array<{ id: string; name: string }>,
  maxRetries: number,
  pollIntervalMs: number,
  labels: { resource: string },
): Promise<{ status: string; message: string; activities: any[]; error?: string }> {
  if (requestIds.length === 0) {
    return {
      status: "completed",
      message: `${labels.resource} updated successfully (synchronous operation)`,
      activities: [],
    };
  }

  let retryCount = 0;
  const completedActivities: any[] = [];
  while (retryCount < maxRetries) {
    try {
      const pending = requestIds.filter(
        (req) => !completedActivities.find((c) => c.activityId === req.id),
      );
      if (pending.length === 0) {
        return {
          status: "completed",
          message: `${labels.resource} updated successfully`,
          activities: completedActivities,
        };
      }
      for (const activity of pending) {
        const details = await getRuckusActivityDetails(token, activity.id, region);
        const isCompleted = details.endDatetime !== undefined;
        const isFailed =
          details.status !== "SUCCESS" && details.status !== "INPROGRESS";
        if (isCompleted) {
          if (details.status === "SUCCESS") {
            completedActivities.push({
              activityId: activity.id,
              name: activity.name,
              status: "SUCCESS",
              details,
            });
          } else {
            return {
              status: "failed",
              message: `${activity.name} failed`,
              error:
                details.error ||
                details.message ||
                "Operation completed with non-SUCCESS status",
              activities: [
                ...completedActivities,
                { activityId: activity.id, name: activity.name, status: details.status, details },
              ],
            };
          }
        } else if (isFailed) {
          return {
            status: "failed",
            message: `${activity.name} failed`,
            error: details.error || details.message || "Operation failed",
            activities: [
              ...completedActivities,
              { activityId: activity.id, name: activity.name, status: details.status, details },
            ],
          };
        }
      }
      retryCount++;
      if (retryCount >= maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling ${labels.resource} activity (attempt ${retryCount}/${maxRetries}):`,
        error,
      );
      if (retryCount >= maxRetries) {
        return {
          status: "timeout",
          message: `${labels.resource} update status unknown - polling timeout`,
          error: "Failed to get activity status after maximum retries",
          activities: completedActivities,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    status: "timeout",
    message: `${labels.resource} update status unknown - polling timeout`,
    activities: completedActivities,
  };
}

/**
 * Generic retrieve-then-merge update (STORY-023) — generalizes the body of
 * updateWifiNetworkWithRetry. GET the current config via `getFn`, apply the
 * caller's partial config as a JSON Merge Patch (RFC 7386), PUT the merged body,
 * then poll the resulting activity. The caller passes a partial config, so
 * unspecified fields are preserved and `null` deletes a field.
 *
 * Only adopt this for a resource once its GET-shaped body is confirmed to round-trip
 * on PUT (R1 tolerates it for WiFi networks and RADIUS profiles; verify per resource —
 * see STORY-023 risk note). Sub-resource association routing stays in the
 * resource-specific function (e.g. update_wifi_network) when needed.
 */
export async function updateResourceWithMerge(opts: {
  token: string;
  id: string;
  partial: any;
  region?: string;
  getFn: (token: string, id: string, region: string) => Promise<any>;
  putUrl: string;
  headers: Record<string, string>;
  resourceName: string;
  maxRetries?: number;
  pollIntervalMs?: number;
}): Promise<any> {
  const {
    token,
    id,
    partial,
    region = "",
    getFn,
    putUrl,
    headers,
    resourceName,
    maxRetries = 20,
    pollIntervalMs = 5000,
  } = opts;

  if (
    !partial ||
    typeof partial !== "object" ||
    Array.isArray(partial) ||
    Object.keys(partial).length === 0
  ) {
    throw new Error(
      `update_${resourceName} requires at least one field to update (send a partial config object).`,
    );
  }

  const current = await getFn(token, id, region);
  const merged = applyMergePatch(current, partial);

  const putResp = await makeRuckusApiCall(
    { method: "put", url: putUrl, data: merged, headers },
    `Update ${resourceName}`,
  );
  const requestId = putResp.data?.requestId;

  const poll = await pollActivities(
    token,
    region,
    requestId ? [{ id: requestId, name: `Update ${resourceName}` }] : [],
    maxRetries,
    pollIntervalMs,
    { resource: resourceName },
  );

  return { id, requestId, ...poll };
}

export async function updateRadiusServerProfileWithRetry(
  token: string,
  profileId: string,
  profileConfig: any = {},
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  // STORY-023: config-driven retrieve-then-merge (generalizes update_wifi_network).
  // Caller passes a PARTIAL profile config; getRadiusServerProfile + applyMergePatch
  // preserve unspecified fields. R1 accepts the GET-shaped body verbatim on PUT
  // (confirmed by trace). To change the server address send primary.ip OR
  // primary.hostname (set the other to null when switching between them).
  const baseApiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud`
      : "https://api.ruckus.cloud";

  return updateResourceWithMerge({
    token,
    id: profileId,
    partial: profileConfig,
    region,
    getFn: getRadiusServerProfile,
    putUrl: `${baseApiUrl}/radiusServerProfiles/${profileId}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.ruckus.v1.1+json",
      Accept: "application/vnd.ruckus.v1.1+json",
    },
    resourceName: "radius_server_profile",
    maxRetries,
    pollIntervalMs,
  });
}

export async function queryPortalServiceProfiles(
  token: string,
  region: string = "",
  filters: any = {},
  searchString: string = "",
  searchTargetFields: string[] = ["name"],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = "name",
  sortOrder: string = "ASC",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/portalServiceProfiles/query`
      : "https://api.ruckus.cloud/portalServiceProfiles/query";

  const payload = {
    filters,
    page,
    pageSize,
    sortField,
    sortOrder,
    searchTargetFields,
    searchString,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query portal service profiles",
  );

  return response.data;
}

export async function getPortalServiceProfile(
  token: string,
  profileId: string,
  region: string = "",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/portalServiceProfiles/${profileId}`
      : `https://api.ruckus.cloud/portalServiceProfiles/${profileId}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get portal service profile",
  );

  return response.data;
}

export async function createPortalServiceProfileWithRetry(
  token: string,
  profileData: {
    name: string;
    content: any;
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/portalServiceProfiles`
      : "https://api.ruckus.cloud/portalServiceProfiles";

  const payload = {
    serviceName: profileData.name,
    content: profileData.content,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create portal service profile",
  );

  const createResponse = response.data;

  const activityId = createResponse.requestId;

  if (!activityId) {
    return {
      ...createResponse,
      status: "completed",
      message:
        "Portal service profile created successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting portal service profile creation status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for portal service profile creation activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...createResponse,
          status: "completed",
          message: "Portal service profile created successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...createResponse,
          status: "failed",
          message: "Portal service profile creation failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message:
            "Portal service profile creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling portal service profile creation activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message:
            "Portal service profile creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "Portal service profile creation status unknown - polling timeout",
    activityId,
  };
}

export async function updatePortalServiceProfileWithRetry(
  token: string,
  profileId: string,
  profileData: {
    name: string;
    content: any;
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/portalServiceProfiles/${profileId}`
      : `https://api.ruckus.cloud/portalServiceProfiles/${profileId}`;

  const payload = {
    serviceName: profileData.name,
    content: profileData.content,
  };

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Update portal service profile",
  );

  const updateResponse = response.data;

  const activityId = updateResponse.requestId;

  if (!activityId) {
    return {
      ...updateResponse,
      status: "completed",
      message:
        "Portal service profile updated successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting portal service profile update status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for portal service profile update activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...updateResponse,
          status: "completed",
          message: "Portal service profile updated successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...updateResponse,
          status: "failed",
          message: "Portal service profile update failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: "timeout",
          message:
            "Portal service profile update status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling portal service profile update activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...updateResponse,
          status: "timeout",
          message:
            "Portal service profile update status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...updateResponse,
    status: "timeout",
    message: "Portal service profile update status unknown - polling timeout",
    activityId,
  };
}

export async function deletePortalServiceProfileWithRetry(
  token: string,
  profileId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/portalServiceProfiles/${profileId}`
      : `https://api.ruckus.cloud/portalServiceProfiles/${profileId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete portal service profile",
  );

  const deleteResponse = response.data;

  const activityId = deleteResponse.requestId;

  if (!activityId) {
    return {
      ...deleteResponse,
      status: "completed",
      message:
        "Portal service profile deleted successfully (synchronous operation)",
    };
  }

  console.log(
    `Starting portal service profile deletion status polling for activity ${activityId}`,
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `Polling attempt ${attempt}/${maxRetries} for portal service profile deletion activity ${activityId}`,
    );

    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...deleteResponse,
          status: "completed",
          message: "Portal service profile deleted successfully",
          activityDetails,
        };
      } else if (activityDetails.status === "FAIL") {
        return {
          ...deleteResponse,
          status: "failed",
          message: "Portal service profile deletion failed",
          error: activityDetails.error || "Unknown error occurred",
          activityDetails,
        };
      }

      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message:
            "Portal service profile deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error: any) {
      console.error(
        `Error polling portal service profile deletion activity (attempt ${attempt}):`,
        error.message,
      );

      if (attempt === maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message:
            "Portal service profile deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "Portal service profile deletion status unknown - polling timeout",
    activityId,
  };
}

export async function queryPrivilegeGroups(
  token: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/roleAuthentications/privilegeGroups`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query privilege groups",
  );

  return response.data;
}

// Helper function to resolve privilege group name to ID
async function resolvePrivilegeGroupId(
  token: string,
  nameOrId: string,
  region: string = "",
): Promise<string> {
  // If it looks like a UUID, assume it's already an ID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      nameOrId,
    )
  ) {
    return nameOrId;
  }

  // Otherwise, resolve name to ID
  const groups = await queryPrivilegeGroups(token, region);
  const group = groups.find((g: any) => g.name === nameOrId);

  if (!group) {
    throw new Error(
      `Privilege group '${nameOrId}' not found. Available groups: ${groups.map((g: any) => g.name).join(", ")}`,
    );
  }

  return group.id;
}

// Helper function to get venues
async function getRuckusVenues(
  token: string,
  region: string = "",
): Promise<any[]> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/query`
      : "https://api.ruckus.cloud/venues/query";

  const payload = {
    fields: ["id", "name"],
    searchTargetFields: ["name", "addressLine", "description", "tagList"],
    filters: {},
    sortField: "name",
    sortOrder: "ASC",
    page: 1,
    pageSize: 10000,
    defaultPageSize: 10,
    total: 0,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get venues",
  );

  return response.data.data || [];
}

// Helper function to resolve venue names to IDs
async function resolveVenueIds(
  token: string,
  venueNames: string[],
  region: string = "",
): Promise<string[]> {
  const venues = await getRuckusVenues(token, region);
  const venueIds: string[] = [];

  for (const nameOrId of venueNames) {
    // If it looks like a UUID, assume it's already an ID
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        nameOrId,
      )
    ) {
      venueIds.push(nameOrId);
      continue;
    }

    // Otherwise, resolve name to ID
    const venue = venues.find((v: any) => v.name === nameOrId);
    if (!venue) {
      throw new Error(
        `Venue '${nameOrId}' not found. Available venues: ${venues.map((v: any) => v.name).join(", ")}`,
      );
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/roleAuthentications/privilegeGroups/${privilegeGroupId}`;

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url,
      data: privilegeGroupData,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Update privilege group",
  );

  const operationResponse = response.data;

  const activityId = operationResponse.requestId;

  if (!activityId) {
    return {
      ...operationResponse,
      status: "completed",
      message: "Operation completed successfully (synchronous operation)",
    };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(
      `[${attempt + 1}/${maxRetries}] Polling activity status for requestId: ${activityId}`,
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...operationResponse,
          ...activityDetails,
          status: "completed",
          message: "Privilege group updated successfully",
        };
      }

      if (activityDetails.status === "FAIL") {
        throw new Error(
          `Update privilege group failed: ${activityDetails.errorMessage || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        return {
          ...operationResponse,
          status: "timeout",
          message: `Update privilege group status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
          activityId,
        };
      }
    }
  }

  return {
    ...operationResponse,
    status: "timeout",
    message: `Update privilege group status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
    activityId,
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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  // Resolve group name to ID
  const privilegeGroupId = await resolvePrivilegeGroupId(
    token,
    privilegeGroupName,
    region,
  );

  // Build the privilege group data
  const privilegeGroupData: any = {
    name,
    roleName,
    delegation,
  };

  // If not all venues, build policies from venue names
  if (!allVenues && venueNames.length > 0) {
    const venueIds = await resolveVenueIds(token, venueNames, region);
    privilegeGroupData.policies = venueIds.map((venueId) => ({
      entityInstanceId: venueId,
      objectType: "com.ruckus.cloud.venue.model.venue",
    }));
  }

  // Call the existing function
  return await updatePrivilegeGroupWithRetry(
    token,
    privilegeGroupId,
    privilegeGroupData,
    region,
    maxRetries,
    pollIntervalMs,
  );
}

export async function queryCustomRoles(
  token: string,
  region: string = "",
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/roleAuthentications/customRoles`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query custom roles",
  );

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
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/roleAuthentications/customRoles/${roleId}`;

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url,
      data: roleData,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Update custom role",
  );

  const operationResponse = response.data;

  const activityId = operationResponse.requestId;

  if (!activityId) {
    return {
      ...operationResponse,
      status: "completed",
      message: "Operation completed successfully (synchronous operation)",
    };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(
      `[${attempt + 1}/${maxRetries}] Polling activity status for requestId: ${activityId}`,
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );
      console.log(`Activity status: ${activityDetails.status}`);

      if (
        activityDetails.status === "COMPLETED" ||
        activityDetails.status === "SUCCESS"
      ) {
        return {
          ...operationResponse,
          ...activityDetails,
          status: "completed",
          message: "Custom role updated successfully",
        };
      }

      if (activityDetails.status === "FAIL") {
        throw new Error(
          `Update custom role failed: ${activityDetails.errorMessage || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        return {
          ...operationResponse,
          status: "timeout",
          message: `Update custom role status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
          activityId,
        };
      }
    }
  }

  return {
    ...operationResponse,
    status: "timeout",
    message: `Update custom role status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
    activityId,
  };
}

export async function queryRoleFeatures(
  token: string,
  region: string = "",
  showScopes: boolean = false,
  category: string = "",
  searchString: string = "",
  page: number = 1,
  pageSize: number = 100,
): Promise<any> {
  const url = `https://api.${region ? region + "." : ""}ruckus.cloud/roleAuthentications/features?showScopes=${showScopes}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query role features",
  );

  let features = response.data;

  // Flatten nested features for easier searching
  const flattenFeatures = (items: any[], result: any[] = []): any[] => {
    for (const item of items) {
      result.push({
        name: item.name,
        description: item.description,
        category: item.category,
      });
      if (item.subFeatures) {
        flattenFeatures(item.subFeatures, result);
      }
    }
    return result;
  };

  features = flattenFeatures(features);

  // Apply category filtering
  if (category && category.trim() !== "") {
    features = features.filter(
      (feature: any) =>
        feature.category &&
        feature.category.toLowerCase() === category.toLowerCase(),
    );
  }

  // Apply search filtering
  if (searchString && searchString.trim() !== "") {
    const search = searchString.toLowerCase();
    features = features.filter(
      (feature: any) =>
        (feature.name && feature.name.toLowerCase().includes(search)) ||
        (feature.description &&
          feature.description.toLowerCase().includes(search)),
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
      totalPages: Math.ceil(features.length / pageSize),
    },
  };
}

export async function createCustomRole(
  token: string,
  name: string,
  features: string[],
  region: string = "",
  preDefinedRole: string = "READ_ONLY",
): Promise<any> {
  const originalFeatures = [...features];
  const enhancedFeatures = [...features];
  const addedPermissions: string[] = [];

  // Map of permission prefixes to their required parent read permission
  const parentMap: Record<string, string> = {
    "wifi.": "wifi-r",
    "switch.": "switch-r",
    "edge.": "edge-r",
    "ai.": "ai-r",
    "admin.": "admin-r",
  };

  // Check each feature for advanced permissions and add parent if missing
  for (const feature of features) {
    // Check for advanced permissions (e.g., wifi.venue-c)
    for (const [prefix, parent] of Object.entries(parentMap)) {
      if (feature.startsWith(prefix) && !enhancedFeatures.includes(parent)) {
        enhancedFeatures.push(parent);
        addedPermissions.push(parent);
        console.log(
          `[MCP] Auto-adding ${parent} as parent permission for ${feature}`,
        );
      }
    }

    // Check for category-wide permissions (e.g., wifi-c, wifi-u, wifi-d)
    const categoryMatch = feature.match(/^(wifi|switch|edge|ai|admin)-[cud]$/);
    if (categoryMatch) {
      const readPerm = `${categoryMatch[1]}-r`;
      if (!enhancedFeatures.includes(readPerm)) {
        enhancedFeatures.push(readPerm);
        addedPermissions.push(readPerm);
        console.log(
          `[MCP] Auto-adding ${readPerm} as base permission for ${feature}`,
        );
      }
    }
  }

  const finalRoleData = {
    name,
    features: [...new Set(enhancedFeatures)], // Remove duplicates
    preDefinedRole,
  };

  const url =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/roleAuthentications/customRoles`
      : "https://api.ruckus.cloud/roleAuthentications/customRoles";

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url,
      data: finalRoleData,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create custom role",
  );

  // Enhance response with metadata about auto-added permissions
  return {
    ...response.data,
    _mcp_metadata: {
      originalFeatures,
      autoAddedPermissions: addedPermissions,
      finalFeatures: finalRoleData.features,
      message:
        addedPermissions.length > 0
          ? `Auto-added parent permissions: ${addedPermissions.join(", ")}`
          : "No additional permissions needed",
    },
  };
}

export async function deleteCustomRoleWithRetry(
  token: string,
  roleId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const url =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/roleAuthentications/customRoles/${roleId}`
      : `https://api.ruckus.cloud/roleAuthentications/customRoles/${roleId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete custom role",
  );

  const deleteResponse = response.data;

  const activityId = deleteResponse.requestId;

  if (!activityId) {
    return {
      ...deleteResponse,
      status: "completed",
      message: "Custom role deleted successfully (synchronous operation)",
    };
  }

  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      const isCompleted = activityDetails.endDatetime !== undefined;

      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        if (activityDetails.status === "SUCCESS") {
          return {
            ...deleteResponse,
            activityDetails,
            status: "completed",
            message: "Custom role deleted successfully",
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: "failed",
            message: "Custom role deletion failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: "failed",
          message: "Custom role deletion failed",
          error:
            activityDetails.error ||
            activityDetails.message ||
            "Operation failed with non-SUCCESS status",
        };
      }

      console.log(
        `[${retryCount + 1}/${maxRetries}] Activity in progress, polling again after ${pollIntervalMs}ms...`,
      );
    } catch (pollError) {
      console.error(`Polling error: ${pollError}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    retryCount++;
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: `Custom role deletion status polling timed out after ${maxRetries} attempts. The operation may still be in progress.`,
    activityId,
  };
}

// ============================================================================
// WiFi Network Management Functions
// ============================================================================

export async function createWifiNetworkWithRetry(
  token: string,
  networkConfig: {
    name: string;
    ssid: string;
    type:
      | "psk"
      | "enterprise"
      | "open"
      | "dpsk"
      | "guestPass"
      | "clickThrough"
      | "selfSignIn"
      | "hostApproval"
      | "cloudpath"
      | "wispr"
      | "directory"
      | "saml"
      | "workflow";
    passphrase?: string;
    wlanSecurity:
      | "WPA2Personal"
      | "WPA3Personal"
      | "WPA2Enterprise"
      | "WPA3Enterprise"
      | "WPA23Mixed"
      | "Open"
      | "None";
    vlanId?: number;
    managementFrameProtection?: "Disabled" | "Capable" | "Required";
    // Advanced customization options (subset of available options)
    maxClientsOnWlanPerRadio?: number;
    enableBandBalancing?: boolean;
    clientIsolation?: boolean;
    hideSsid?: boolean;
    enableFastRoaming?: boolean;
    mobilityDomainId?: number;
    wifi6Enabled?: boolean;
    wifi7Enabled?: boolean;
    // Guest pass specific options
    guestPortal?: any;
    portalServiceProfileId?: string;
    // Enterprise 802.1x specific options
    radiusServiceProfileId?: string;
    accountingRadiusServiceProfileId?: string;
    // Proxy settings for enterprise 802.1x (required for FQDN-based RADIUS)
    enableAuthProxy?: boolean;
    enableAccountingProxy?: boolean;
    // Self Sign-In channel and domain options
    allowedEmailDomains?: string[];
    sessionDurationDays?: number;
    enableSmsLogin?: boolean;
    enableEmailLogin?: boolean;
    enableWhatsappLogin?: boolean;
    smsPasswordDuration?: {
      duration: number;
      unit: "MINUTE" | "HOUR" | "DAY";
    };
    // Guest and Self Sign-In shared options
    maxDevices?: number;
    // RADIUS options for Enterprise 802.1x (NAS ID configuration)
    radiusOptions?: {
      nasIdType?: "AP_GROUP_NAME" | "BSSID" | "VENUE_NAME" | "AP_MAC" | "USER";
      userDefinedNasId?: string; // Required when nasIdType is "USER"
      nasRequestTimeoutSec?: number;
      nasMaxRetry?: number;
      nasReconnectPrimaryMin?: number;
      calledStationIdType?: "BSSID";
    };
    // OWE Transition options (for type=open only)
    oweEnabled?: boolean;
    oweTransitionEnabled?: boolean;
    // DPSK/DSAE specific options
    dpskServiceId?: string;
    // Self Sign-In temporary connection (pre-OTP limited access)
    temporaryConnectionEnabled?: boolean;
    temporaryConnection?: {
      duration?: number;
      maxDownloadRate?: number;
      maxUploadRate?: number;
    };
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks`
      : "https://api.ruckus.cloud/wifiNetworks";

  // Build WLAN configuration payload
  const isCaptivePortal = networkConfig.type in PORTAL_TYPE_TO_WIRE;
  const isSelfSignInType = networkConfig.type === "selfSignIn";
  const isSimplePortalType = isCaptivePortal && !isSelfSignInType;
  const isEnterpriseType = networkConfig.type === "enterprise";
  const isOweTransition =
    networkConfig.type === "open" &&
    networkConfig.oweEnabled === true &&
    networkConfig.oweTransitionEnabled === true;
  const isDsaeType =
    networkConfig.type === "dpsk" &&
    networkConfig.wlanSecurity === "WPA23Mixed";

  // Map types for RUCKUS API: 'enterprise' -> 'aaa', any captive-portal -> 'guest'
  const apiType = isEnterpriseType
    ? "aaa"
    : isCaptivePortal
      ? "guest"
      : networkConfig.type;

  const basePayload: any = {
    name: networkConfig.name,
    type: apiType,
    isCloudpathEnabled: false,
    venues: [], // Empty - network created without venue activation
    enableAccountingService: false,
    hotspot20Settings: {},
  };

  // Add OWE Transition flag to base payload
  if (isOweTransition) {
    basePayload.enableOweTransition = true;
  }

  // Add DSAE (DPSK WPA2/WPA3-Mixed) flags to base payload
  if (isDsaeType) {
    basePayload.dpskWlanSecurity = "WPA23Mixed";
    basePayload.useDpskService = true;
  }

  // Build WLAN configuration
  const wlanConfig: any = {
    ssid: networkConfig.ssid,
    // OWE Transition uses "OWETransition" as wlanSecurity value
    wlanSecurity: isOweTransition
      ? "OWETransition"
      : networkConfig.wlanSecurity,
    enable: true,
    vlanId: networkConfig.vlanId || 1,
  };

  // Add passphrase for PSK networks
  if (networkConfig.passphrase && !isCaptivePortal) {
    wlanConfig.passphrase = networkConfig.passphrase;
  }

  // Guest pass and Self Sign-In specific WLAN settings
  if (isCaptivePortal) {
    wlanConfig.bypassCPUsingMacAddressAuthentication = true;
    wlanConfig.bypassCNA = false;
    wlanConfig.macAddressAuthentication = false;
  } else if (!isOweTransition) {
    // OWE Transition does not include managementFrameProtection in the payload
    wlanConfig.managementFrameProtection =
      networkConfig.managementFrameProtection || "Disabled";
  }

  // Advanced customization (common for all types)
  wlanConfig.advancedCustomization = {
    userUplinkRateLimiting: 0,
    userDownlinkRateLimiting: 0,
    maxClientsOnWlanPerRadio: networkConfig.maxClientsOnWlanPerRadio || 100,
    // DSAE (DPSK3 / WPA2-WPA3-mixed DPSK) forbids band balancing — R1 rejects it
    // with WIFI-12024. Force it off for DSAE regardless of caller input; otherwise
    // default on (caller may override).
    enableBandBalancing: isDsaeType
      ? false
      : networkConfig.enableBandBalancing !== undefined
        ? networkConfig.enableBandBalancing
        : true,
    clientIsolation:
      networkConfig.clientIsolation !== undefined
        ? networkConfig.clientIsolation
        : isCaptivePortal || isOweTransition
          ? true
          : false,
    clientIsolationOptions: {
      autoVrrp: false,
    },
    hideSsid: networkConfig.hideSsid || false,
    forceMobileDeviceDhcp: false,
    clientLoadBalancingEnable: true,
    enableAaaVlanOverride: true,
    directedThreshold: 5,
    enableNeighborReport: true,
    enableFastRoaming: networkConfig.enableFastRoaming || false,
    mobilityDomainId: networkConfig.mobilityDomainId || 1,
    radioCustomization: {
      rfBandUsage: "BOTH",
      phyTypeConstraint: "NONE",
    },
    enableSyslog: false,
    clientInactivityTimeout: 120,
    accessControlEnable: false,
    respectiveAccessControl: true,
    applicationPolicyEnable: false,
    l2AclEnable: false,
    l3AclEnable: false,
    wifiCallingEnabled: false,
    proxyARP: false,
    enableAirtimeDecongestion: false,
    enableJoinRSSIThreshold: false,
    joinRSSIThreshold: -85,
    enableTransientClientManagement: false,
    joinWaitTime: 30,
    joinExpireTime: 300,
    joinWaitThreshold: 10,
    enableOptimizedConnectivityExperience: false,
    broadcastProbeResponseDelay: 15,
    rssiAssociationRejectionThreshold: -75,
    enableAntiSpoofing: false,
    enableArpRequestRateLimit: true,
    arpRequestRateLimit: 15,
    enableDhcpRequestRateLimit: true,
    dhcpRequestRateLimit: 15,
    dnsProxyEnabled: false,
    dnsProxy: {
      dnsProxyRules: [],
    },
    bssPriority: "HIGH",
    dhcpOption82Enabled: false,
    dhcpOption82SubOption1Enabled: false,
    dhcpOption82SubOption1Format: null,
    dhcpOption82SubOption2Enabled: false,
    dhcpOption82SubOption2Format: null,
    dhcpOption82SubOption150Enabled: false,
    dhcpOption82SubOption151Enabled: false,
    dhcpOption82SubOption151Format: null,
    dhcpOption82MacFormat: null,
    enableMulticastUplinkRateLimiting: false,
    enableMulticastDownlinkRateLimiting: false,
    enableMulticastUplinkRateLimiting6G: false,
    enableMulticastDownlinkRateLimiting6G: false,
    wifi6Enabled:
      networkConfig.wifi6Enabled !== undefined
        ? networkConfig.wifi6Enabled
        : true,
    wifi7Enabled:
      networkConfig.wifi7Enabled !== undefined
        ? networkConfig.wifi7Enabled
        : true,
    multiLinkOperationEnabled: false,
    multiLinkOperationOptions: {
      enable24G: true,
      enable50G: true,
      enable6G: true,
    },
    qosMirroringEnabled: true,
    qosMapSetEnabled: false,
    qosMapSetOptions: {
      rules: [],
    },
    applicationVisibilityEnabled: true,
    // Add RADIUS options for Enterprise 802.1x networks
    ...(isEnterpriseType && networkConfig.radiusOptions
      ? {
          radiusOptions: {
            nasIdType: networkConfig.radiusOptions.nasIdType || "AP_GROUP_NAME",
            ...(networkConfig.radiusOptions.nasIdType === "USER" &&
            networkConfig.radiusOptions.userDefinedNasId
              ? {
                  userDefinedNasId:
                    networkConfig.radiusOptions.userDefinedNasId,
                }
              : {}),
            nasRequestTimeoutSec:
              networkConfig.radiusOptions.nasRequestTimeoutSec ?? 3,
            nasMaxRetry: networkConfig.radiusOptions.nasMaxRetry ?? 2,
            nasReconnectPrimaryMin:
              networkConfig.radiusOptions.nasReconnectPrimaryMin ?? 5,
            calledStationIdType:
              networkConfig.radiusOptions.calledStationIdType || "BSSID",
          },
        }
      : isEnterpriseType
        ? {
            // Default RADIUS options for enterprise networks
            radiusOptions: {
              nasIdType: "AP_GROUP_NAME",
              nasRequestTimeoutSec: 3,
              nasMaxRetry: 2,
              nasReconnectPrimaryMin: 5,
              calledStationIdType: "BSSID",
            },
          }
        : {}),
  };

  wlanConfig.advancedCustomization = wlanConfig.advancedCustomization;
  basePayload.wlan = wlanConfig;

  // Add guest portal configuration for the 8 "simple" captive-portal sub-types
  // (everything except selfSignIn, which has its own channel-aware block below).
  // Defaults match the Guest-Pass-style payload the admin GUI submits; caller-
  // provided guestPortal fields are merged on top so companion fields (e.g.
  // hostContacts for hostApproval) can be added without losing the
  // tool-injected discriminator.
  if (isSimplePortalType) {
    basePayload.guestPortal = {
      guestNetworkType: PORTAL_TYPE_TO_WIRE[networkConfig.type],
      enableSelfService: true,
      endOfDayReauthDelay: false,
      lockoutPeriod: 120,
      lockoutPeriodEnabled: false,
      macCredentialsDuration: 240,
      maxDevices: networkConfig.maxDevices || 1,
      userSessionGracePeriod: 60,
      userSessionTimeout: 1440,
      walledGardens: [],
      ...(networkConfig.guestPortal || {}),
    };
    basePayload.redirectCheckbox = false;
    basePayload.enableDhcp = false;
  }

  // Add guest portal configuration for Self Sign-In (Email / SMS / WhatsApp)
  if (isSelfSignInType) {
    // Back-compat default: Email-only when no channel flag is specified.
    const anyChannelSpecified =
      networkConfig.enableSmsLogin !== undefined ||
      networkConfig.enableEmailLogin !== undefined ||
      networkConfig.enableWhatsappLogin !== undefined;
    const enableSmsLogin = networkConfig.enableSmsLogin === true;
    const enableEmailLogin = anyChannelSpecified
      ? networkConfig.enableEmailLogin === true
      : true;
    const enableWhatsappLogin = networkConfig.enableWhatsappLogin === true;

    if (!enableSmsLogin && !enableEmailLogin && !enableWhatsappLogin) {
      throw new Error(
        "At least one Self Sign-In channel must be enabled: set enableSmsLogin, enableEmailLogin, or enableWhatsappLogin to true.",
      );
    }

    // Strict validation: surface caller mistakes early rather than silently
    // dropping inputs that won't take effect.
    if (networkConfig.smsPasswordDuration !== undefined && !enableSmsLogin) {
      throw new Error(
        "smsPasswordDuration requires enableSmsLogin=true; it has no effect when SMS is disabled.",
      );
    }
    if (
      (networkConfig.allowedEmailDomains?.length ?? 0) > 0 &&
      !enableEmailLogin
    ) {
      throw new Error(
        "allowedEmailDomains requires enableEmailLogin=true; email restrictions have no effect when Email is disabled.",
      );
    }

    const sessionDurationDays = networkConfig.sessionDurationDays || 12;
    const allowedDomains = networkConfig.allowedEmailDomains || [];

    // smsPasswordDuration: when SMS is on, use caller input or UI default {12, HOUR}.
    // When SMS is off, preserve the existing email-session-duration-in-days quirk
    // (server reuses this field; untangling is out of scope for #67).
    const smsPasswordDuration = enableSmsLogin
      ? networkConfig.smsPasswordDuration || { duration: 12, unit: "HOUR" }
      : { duration: sessionDurationDays, unit: "DAY" };

    const allowSign: string[] = [];
    if (enableSmsLogin) allowSign.push("enableSmsLogin");
    if (enableEmailLogin) allowSign.push("enableEmailLogin");
    if (enableWhatsappLogin) allowSign.push("enableWhatsappLogin");

    basePayload.guestPortal = {
      guestNetworkType: "SelfSignIn",
      enableSelfService: true,
      endOfDayReauthDelay: false,
      lockoutPeriod: 120,
      lockoutPeriodEnabled: false,
      macCredentialsDuration: 240,
      maxDevices: networkConfig.maxDevices || 1,
      userSessionGracePeriod: 60,
      userSessionTimeout: 1440,
      enableSmsLogin,
      enableEmailLogin,
      enableWhatsappLogin,
      socialIdentities: {},
      socialDomains: enableEmailLogin ? allowedDomains : [],
      socialEmails: enableEmailLogin,
      walledGardens: [],
      smsPasswordDuration,
      ...(networkConfig.temporaryConnectionEnabled !== undefined
        ? { temporaryConnectionEnabled: networkConfig.temporaryConnectionEnabled }
        : {}),
      ...(networkConfig.temporaryConnection !== undefined
        ? { temporaryConnection: networkConfig.temporaryConnection }
        : {}),
    };
    basePayload.allowSign = allowSign;
    basePayload.allowedDomainsCheckbox =
      enableEmailLogin && allowedDomains.length > 0;
    basePayload.redirectCheckbox = false;
    basePayload.enableDhcp = false;
  }

  const payload = basePayload;

  // Step 1: Create WiFi network
  console.log("[RUCKUS] Creating WiFi network...");
  const createResponse = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create WiFi network",
  );

  const createData = createResponse.data;
  const createRequestId = createData.requestId;
  const networkId = createData.response?.id;

  if (!createRequestId) {
    throw new Error("No requestId returned from WiFi network creation API");
  }

  if (!networkId) {
    throw new Error("No network ID returned from WiFi network creation API");
  }

  console.log(
    `[RUCKUS] WiFi network created with ID: ${networkId}, requestId: ${createRequestId}`,
  );

  // Step 2: Associate portal service profile for guest pass and self sign-in networks
  let portalRequestId: string | undefined;
  if (isCaptivePortal && networkConfig.portalServiceProfileId) {
    console.log("[RUCKUS] Associating portal service profile...");
    const portalUrl = `${apiUrl}/${networkId}/portalServiceProfiles/${networkConfig.portalServiceProfileId}`;

    const portalResponse = await makeRuckusApiCall(
      {
        method: "put",
        url: portalUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      "Associate portal service profile",
    );

    const portalData = portalResponse.data;
    portalRequestId = portalData.requestId;

    if (!portalRequestId) {
      console.warn(
        "[RUCKUS] No requestId returned from portal service profile association API (may be synchronous)",
      );
    }
  }

  // Step 2.5: Set RADIUS server profile settings (MUST come before RADIUS profile association for FQDN-based RADIUS)
  console.log("[RUCKUS] Configuring RADIUS settings...");
  const radiusUrl = `${apiUrl}/${networkId}/radiusServerProfileSettings`;

  // For enterprise networks with RADIUS, use provided proxy settings (required for FQDN-based RADIUS)
  // For other network types, send empty object
  const radiusPayload =
    isEnterpriseType && networkConfig.radiusServiceProfileId
      ? {
          enableAccountingProxy: networkConfig.enableAccountingProxy ?? false,
          enableAuthProxy: networkConfig.enableAuthProxy ?? false,
        }
      : {};

  const radiusResponse = await makeRuckusApiCall(
    {
      method: "put",
      url: radiusUrl,
      data: radiusPayload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Configure RADIUS settings",
  );

  const radiusData = radiusResponse.data;
  const radiusRequestId = radiusData.requestId;

  if (!radiusRequestId) {
    console.warn(
      "[RUCKUS] No requestId returned from RADIUS settings API (may be synchronous)",
    );
  }

  // Step 3: Associate RADIUS service profile for enterprise 802.1x networks (AFTER proxy settings are configured)
  let radiusServiceProfileRequestId: string | undefined;
  if (isEnterpriseType && networkConfig.radiusServiceProfileId) {
    console.log("[RUCKUS] Associating RADIUS service profile for 802.1x...");
    const radiusServiceUrl = `${apiUrl}/${networkId}/radiusServerProfiles/${networkConfig.radiusServiceProfileId}`;

    const radiusServiceResponse = await makeRuckusApiCall(
      {
        method: "put",
        url: radiusServiceUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      "Associate RADIUS service profile",
    );

    radiusServiceProfileRequestId = radiusServiceResponse.data.requestId;

    if (!radiusServiceProfileRequestId) {
      console.warn(
        "[RUCKUS] No requestId returned from RADIUS service profile association API (may be synchronous)",
      );
    }
  }

  // Step 4: Associate accounting RADIUS service profile for enterprise 802.1x networks
  let accountingRadiusServiceProfileRequestId: string | undefined;
  if (isEnterpriseType && networkConfig.accountingRadiusServiceProfileId) {
    console.log(
      "[RUCKUS] Associating accounting RADIUS service profile for 802.1x...",
    );
    const accountingRadiusServiceUrl = `${apiUrl}/${networkId}/radiusServerProfiles/${networkConfig.accountingRadiusServiceProfileId}`;

    const accountingRadiusServiceResponse = await makeRuckusApiCall(
      {
        method: "put",
        url: accountingRadiusServiceUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      "Associate accounting RADIUS service profile",
    );

    accountingRadiusServiceProfileRequestId =
      accountingRadiusServiceResponse.data.requestId;

    if (!accountingRadiusServiceProfileRequestId) {
      console.warn(
        "[RUCKUS] No requestId returned from accounting RADIUS service profile association API (may be synchronous)",
      );
    }
  }

  // Step 5: Associate DPSK service for DPSK/DSAE networks
  let dpskServiceRequestId: string | undefined;
  if (isDsaeType && networkConfig.dpskServiceId) {
    console.log("[RUCKUS] Associating DPSK service...");
    const dpskServiceUrl = `${apiUrl}/${networkId}/dpskServices/${networkConfig.dpskServiceId}`;

    const dpskServiceResponse = await makeRuckusApiCall(
      {
        method: "put",
        url: dpskServiceUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      "Associate DPSK service",
    );

    dpskServiceRequestId = dpskServiceResponse.data.requestId;

    if (!dpskServiceRequestId) {
      console.warn(
        "[RUCKUS] No requestId returned from DPSK service association API (may be synchronous)",
      );
    }
  }

  // Poll all operations for completion
  const requestIds = [
    { id: createRequestId, name: "Create WiFi network" },
    ...(portalRequestId
      ? [{ id: portalRequestId, name: "Associate portal service profile" }]
      : []),
    ...(radiusServiceProfileRequestId
      ? [
          {
            id: radiusServiceProfileRequestId,
            name: "Associate RADIUS service profile",
          },
        ]
      : []),
    ...(accountingRadiusServiceProfileRequestId
      ? [
          {
            id: accountingRadiusServiceProfileRequestId,
            name: "Associate accounting RADIUS service profile",
          },
        ]
      : []),
    ...(radiusRequestId
      ? [{ id: radiusRequestId, name: "Configure RADIUS settings" }]
      : []),
    ...(dpskServiceRequestId
      ? [{ id: dpskServiceRequestId, name: "Associate DPSK service" }]
      : []),
  ];

  let retryCount = 0;
  const completedActivities: any[] = [];

  while (retryCount < maxRetries) {
    try {
      // Check status of all pending activities
      const pendingActivities = requestIds.filter(
        (req) => !completedActivities.find((c) => c.activityId === req.id),
      );

      if (pendingActivities.length === 0) {
        // All activities completed
        return {
          networkId,
          createRequestId,
          portalRequestId,
          radiusServiceProfileRequestId,
          accountingRadiusServiceProfileRequestId,
          radiusRequestId,
          status: "completed",
          message: "WiFi network created successfully",
          activities: completedActivities,
        };
      }

      // Poll each pending activity
      for (const activity of pendingActivities) {
        const activityDetails = await getRuckusActivityDetails(
          token,
          activity.id,
          region,
        );

        const isCompleted = activityDetails.endDatetime !== undefined;
        const isFailed =
          activityDetails.status !== "SUCCESS" &&
          activityDetails.status !== "INPROGRESS";

        if (isCompleted) {
          if (activityDetails.status === "SUCCESS") {
            console.log(`[RUCKUS] ${activity.name} completed successfully`);
            completedActivities.push({
              activityId: activity.id,
              name: activity.name,
              status: "SUCCESS",
              details: activityDetails,
            });
          } else {
            // Operation failed
            return {
              networkId,
              createRequestId,
              portalRequestId,
              radiusServiceProfileRequestId,
              accountingRadiusServiceProfileRequestId,
              radiusRequestId,
              status: "failed",
              message: `${activity.name} failed`,
              error:
                activityDetails.error ||
                activityDetails.message ||
                "Operation completed with non-SUCCESS status",
              activities: [
                ...completedActivities,
                {
                  activityId: activity.id,
                  name: activity.name,
                  status: activityDetails.status,
                  details: activityDetails,
                },
              ],
            };
          }
        } else if (isFailed) {
          // Operation failed without completion
          return {
            networkId,
            createRequestId,
            portalRequestId,
            radiusServiceProfileRequestId,
            accountingRadiusServiceProfileRequestId,
            radiusRequestId,
            status: "failed",
            message: `${activity.name} failed`,
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation failed",
            activities: [
              ...completedActivities,
              {
                activityId: activity.id,
                name: activity.name,
                status: activityDetails.status,
                details: activityDetails,
              },
            ],
          };
        }
      }

      // If some activities still pending, increment retry count
      retryCount++;
      console.log(
        `[RUCKUS] WiFi network creation in progress, attempt ${retryCount}/${maxRetries}`,
      );

      if (retryCount >= maxRetries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      if (retryCount >= maxRetries) {
        return {
          networkId,
          createRequestId,
          portalRequestId,
          radiusServiceProfileRequestId,
          accountingRadiusServiceProfileRequestId,
          radiusRequestId,
          status: "timeout",
          message: "WiFi network creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
          activities: completedActivities,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    networkId,
    createRequestId,
    portalRequestId,
    radiusServiceProfileRequestId,
    accountingRadiusServiceProfileRequestId,
    radiusRequestId,
    status: "timeout",
    message: "WiFi network creation status unknown - polling timeout",
    activities: completedActivities,
  };
}

export async function activateWifiNetworkAtVenuesWithRetry(
  token: string,
  networkId: string,
  venueConfigs: Array<{
    venueId: string;
    isAllApGroups: boolean;
    apGroups?: string[];
    allApGroupsRadio: "Both" | "2.4GHz" | "5GHz" | "6GHz";
    allApGroupsRadioTypes: string[];
    scheduler: {
      type: "ALWAYS_ON" | "CUSTOM";
      [key: string]: any;
    };
  }>,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
  portalServiceProfileId?: string,
): Promise<any> {
  const baseApiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud`
      : "https://api.ruckus.cloud";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // STORY-024: uniform per-venue activation for ALL network types. Confirmed by GUI
  // trace that activation is `PUT /venues/{venueId}/wifiNetworks/{networkId}` (carrying
  // the scheduler, incl. CUSTOM from build_wifi_scheduler_config) plus the per-venue
  // `/settings` PUT — for every type. No type branch, no full-config `venues[]` PUT, and
  // no RADIUS-settings step (a create-time concern; re-running it on an FQDN enterprise
  // net would trip WIFI-20049).
  const allRequestIds: Array<{ id: string; name: string }> = [];

  // Optional: (re)associate a portal service profile (e.g. for guest-pass networks).
  if (portalServiceProfileId) {
    console.log("[RUCKUS] Associating portal service profile...");
    const portalRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseApiUrl}/wifiNetworks/${networkId}/portalServiceProfiles/${portalServiceProfileId}`,
          headers,
        },
        "Associate portal service profile",
      )
    ).data.requestId;
    if (portalRequestId) {
      allRequestIds.push({
        id: portalRequestId,
        name: "Associate portal service profile",
      });
    }
  }

  for (const venueConfig of venueConfigs) {
    const venueId = venueConfig.venueId;
    const venuePayload = {
      apGroups: venueConfig.apGroups || [],
      scheduler: venueConfig.scheduler,
      isAllApGroups: venueConfig.isAllApGroups,
      allApGroupsRadio: venueConfig.allApGroupsRadio,
      allApGroupsRadioTypes: venueConfig.allApGroupsRadioTypes,
      venueId,
      networkId,
    };

    // Activate the network at the venue.
    console.log(`[RUCKUS] Activating network at venue ${venueId}...`);
    const activateRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseApiUrl}/venues/${venueId}/wifiNetworks/${networkId}`,
          data: venuePayload,
          headers,
        },
        `Activate network at venue ${venueId}`,
      )
    ).data.requestId;
    if (activateRequestId) {
      allRequestIds.push({
        id: activateRequestId,
        name: `Activate at venue ${venueId}`,
      });
    }

    // Apply venue-level settings — carries the scheduler (required for CUSTOM schedules,
    // which the per-venue activation alone does not fully apply).
    console.log(`[RUCKUS] Updating settings for venue ${venueId}...`);
    const settingsRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseApiUrl}/venues/${venueId}/wifiNetworks/${networkId}/settings`,
          data: venuePayload,
          headers,
        },
        `Update settings for venue ${venueId}`,
      )
    ).data.requestId;
    if (settingsRequestId) {
      allRequestIds.push({
        id: settingsRequestId,
        name: `Update settings for venue ${venueId}`,
      });
    }
  }

  // Poll all operations for completion
  let retryCount = 0;
  const completedActivities: any[] = [];

  while (retryCount < maxRetries) {
    try {
      const pendingActivities = allRequestIds.filter(
        (req) => !completedActivities.find((c) => c.activityId === req.id),
      );

      if (pendingActivities.length === 0) {
        return {
          networkId,
          venueIds: venueConfigs.map((v) => v.venueId),
          status: "completed",
          message: `WiFi network activated successfully at ${venueConfigs.length} venue(s)`,
          activities: completedActivities,
        };
      }

      for (const activity of pendingActivities) {
        const activityDetails = await getRuckusActivityDetails(
          token,
          activity.id,
          region,
        );

        const isCompleted = activityDetails.endDatetime !== undefined;
        const isFailed =
          activityDetails.status !== "SUCCESS" &&
          activityDetails.status !== "INPROGRESS";

        if (isCompleted) {
          if (activityDetails.status === "SUCCESS") {
            console.log(`[RUCKUS] ${activity.name} completed successfully`);
            completedActivities.push({
              activityId: activity.id,
              name: activity.name,
              status: "SUCCESS",
              details: activityDetails,
            });
          } else {
            return {
              networkId,
              venueIds: venueConfigs.map((v) => v.venueId),
              status: "failed",
              message: `${activity.name} failed`,
              error:
                activityDetails.error ||
                activityDetails.message ||
                "Operation completed with non-SUCCESS status",
              activities: [
                ...completedActivities,
                {
                  activityId: activity.id,
                  name: activity.name,
                  status: activityDetails.status,
                  details: activityDetails,
                },
              ],
            };
          }
        } else if (isFailed) {
          return {
            networkId,
            venueIds: venueConfigs.map((v) => v.venueId),
            status: "failed",
            message: `${activity.name} failed`,
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation failed",
            activities: [
              ...completedActivities,
              {
                activityId: activity.id,
                name: activity.name,
                status: activityDetails.status,
                details: activityDetails,
              },
            ],
          };
        }
      }

      retryCount++;
      console.log(
        `[RUCKUS] WiFi network activation in progress, attempt ${retryCount}/${maxRetries} (${pendingActivities.length} operations pending)`,
      );

      if (retryCount >= maxRetries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      if (retryCount >= maxRetries) {
        return {
          networkId,
          venueIds: venueConfigs.map((v) => v.venueId),
          status: "timeout",
          message: "WiFi network activation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
          activities: completedActivities,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    networkId,
    venueIds: venueConfigs.map((v) => v.venueId),
    status: "timeout",
    message: "WiFi network activation status unknown - polling timeout",
    activities: completedActivities,
  };
}

export async function activateWifiNetworkAtVenueWithRetry(
  token: string,
  networkId: string,
  venueId: string,
  venueConfig: {
    isAllApGroups: boolean;
    apGroups?: string[];
    allApGroupsRadio: "Both" | "2.4GHz" | "5GHz" | "6GHz";
    allApGroupsRadioTypes: string[];
    scheduler: {
      type: "ALWAYS_ON" | "CUSTOM";
      [key: string]: any;
    };
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  // This is a convenience wrapper around activateWifiNetworkAtVenuesWithRetry
  // for activating at a single venue
  console.log(`[RUCKUS] Activating WiFi network at single venue: ${venueId}`);

  const venueConfigs = [
    {
      venueId,
      ...venueConfig,
    },
  ];

  return activateWifiNetworkAtVenuesWithRetry(
    token,
    networkId,
    venueConfigs,
    region,
    maxRetries,
    pollIntervalMs,
  );
}

export async function queryWifiNetworks(
  token: string,
  region: string = "",
  filters: any = {},
  fields: string[] = [
    "name",
    "description",
    "nwSubType",
    "venueApGroups",
    "apSerialNumbers",
    "apCount",
    "clientCount",
    "vlan",
    "cog",
    "ssid",
    "vlanPool",
    "captiveType",
    "id",
    "securityProtocol",
    "dsaeOnboardNetwork",
    "isOweMaster",
    "owePairNetworkId",
    "tunnelWlanEnable",
    "isEnforced",
  ],
  searchString: string = "",
  searchTargetFields: string[] = ["name"],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = "name",
  sortOrder: string = "ASC",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks/query`
      : "https://api.ruckus.cloud/wifiNetworks/query";

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
    searchTargetFields,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query WiFi networks",
  );

  return response.data;
}

export async function getWifiNetwork(
  token: string,
  networkId: string,
  region: string = "",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks/${networkId}`
      : `https://api.ruckus.cloud/wifiNetworks/${networkId}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Get WiFi network",
  );

  return response.data;
}

export async function updateWifiNetworkWithRetry(
  token: string,
  networkId: string,
  networkConfig: any = {},
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const baseUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks/${networkId}`
      : `https://api.ruckus.cloud/wifiNetworks/${networkId}`;

  // STORY-022: update_wifi_network is config-driven. Sub-resource association keys are
  // extracted from networkConfig and routed to their own R1 endpoints; the remaining keys
  // form the config-body merge patch applied via retrieve-then-merge. This keeps the tool
  // surface to (networkId, networkConfig) while orchestrating the multi-endpoint chain.
  const {
    portalServiceProfileId,
    radiusServiceProfileId,
    accountingRadiusServiceProfileId,
    enableAuthProxy,
    enableAccountingProxy,
    ...configBody
  } = networkConfig || {};

  const hasConfigBody =
    configBody &&
    typeof configBody === "object" &&
    Object.keys(configBody).length > 0;
  const hasPortal = !!portalServiceProfileId;
  const hasRadiusSettings =
    enableAuthProxy !== undefined || enableAccountingProxy !== undefined;
  const hasRadiusProfile = !!radiusServiceProfileId;
  const hasAccountingRadiusProfile = !!accountingRadiusServiceProfileId;

  if (
    !hasConfigBody &&
    !hasPortal &&
    !hasRadiusSettings &&
    !hasRadiusProfile &&
    !hasAccountingRadiusProfile
  ) {
    throw new Error(
      "update_wifi_network requires at least one change: a networkConfig field to update, " +
        "portalServiceProfileId, radiusServiceProfileId, accountingRadiusServiceProfileId, " +
        "enableAuthProxy, or enableAccountingProxy.",
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Step 1: WLAN config PUT (retrieve-then-merge) — only when config-body fields are present.
  // R1 accepts the GET-shaped body verbatim on PUT (confirmed by trace), so no reshape.
  let updateRequestId: string | undefined;
  if (hasConfigBody) {
    const currentConfig = await getWifiNetwork(token, networkId, region);
    const mergedConfig = applyMergePatch(currentConfig, configBody);
    updateRequestId = (
      await makeRuckusApiCall(
        { method: "put", url: baseUrl, data: mergedConfig, headers },
        "Update WiFi network",
      )
    ).data.requestId;
  }

  // Step 2: RADIUS proxy settings — MUST precede an FQDN RADIUS-profile association (WIFI-20049).
  let radiusSettingsRequestId: string | undefined;
  if (hasRadiusSettings) {
    radiusSettingsRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseUrl}/radiusServerProfileSettings`,
          data: {
            enableAccountingProxy: enableAccountingProxy ?? false,
            enableAuthProxy: enableAuthProxy ?? false,
          },
          headers,
        },
        "Update RADIUS server profile settings",
      )
    ).data.requestId;
  }

  // Step 3: Portal service profile association.
  let portalRequestId: string | undefined;
  if (hasPortal) {
    portalRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseUrl}/portalServiceProfiles/${portalServiceProfileId}`,
          headers,
        },
        "Associate portal service profile",
      )
    ).data.requestId;
  }

  // Step 4: RADIUS authentication service profile association.
  let radiusProfileRequestId: string | undefined;
  if (hasRadiusProfile) {
    radiusProfileRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseUrl}/radiusServerProfiles/${radiusServiceProfileId}`,
          headers,
        },
        "Associate RADIUS service profile",
      )
    ).data.requestId;
  }

  // Step 5: RADIUS accounting service profile association.
  let accountingRadiusProfileRequestId: string | undefined;
  if (hasAccountingRadiusProfile) {
    accountingRadiusProfileRequestId = (
      await makeRuckusApiCall(
        {
          method: "put",
          url: `${baseUrl}/radiusServerProfiles/${accountingRadiusServiceProfileId}`,
          headers,
        },
        "Associate accounting RADIUS service profile",
      )
    ).data.requestId;
  }

  const requestIds = [
    ...(updateRequestId
      ? [{ id: updateRequestId, name: "Update WiFi network" }]
      : []),
    ...(radiusSettingsRequestId
      ? [
          {
            id: radiusSettingsRequestId,
            name: "Update RADIUS server profile settings",
          },
        ]
      : []),
    ...(portalRequestId
      ? [{ id: portalRequestId, name: "Associate portal service profile" }]
      : []),
    ...(radiusProfileRequestId
      ? [{ id: radiusProfileRequestId, name: "Associate RADIUS service profile" }]
      : []),
    ...(accountingRadiusProfileRequestId
      ? [
          {
            id: accountingRadiusProfileRequestId,
            name: "Associate accounting RADIUS service profile",
          },
        ]
      : []),
  ];

  const responseIds = {
    networkId,
    updateRequestId,
    radiusSettingsRequestId,
    portalRequestId,
    radiusProfileRequestId,
    accountingRadiusProfileRequestId,
  };

  // All operations were synchronous (no requestId to poll).
  if (requestIds.length === 0) {
    return {
      ...responseIds,
      status: "completed",
      message: "WiFi network updated successfully (synchronous operation)",
    };
  }

  // Consolidated polling across all activities (mirrors createWifiNetworkWithRetry).
  let retryCount = 0;
  const completedActivities: any[] = [];
  while (retryCount < maxRetries) {
    try {
      const pending = requestIds.filter(
        (req) => !completedActivities.find((c) => c.activityId === req.id),
      );
      if (pending.length === 0) {
        return {
          ...responseIds,
          status: "completed",
          message: "WiFi network updated successfully",
          activities: completedActivities,
        };
      }
      for (const activity of pending) {
        const details = await getRuckusActivityDetails(token, activity.id, region);
        const isCompleted = details.endDatetime !== undefined;
        const isFailed =
          details.status !== "SUCCESS" && details.status !== "INPROGRESS";
        if (isCompleted) {
          if (details.status === "SUCCESS") {
            completedActivities.push({
              activityId: activity.id,
              name: activity.name,
              status: "SUCCESS",
              details,
            });
          } else {
            return {
              ...responseIds,
              status: "failed",
              message: `${activity.name} failed`,
              error:
                details.error ||
                details.message ||
                "Operation completed with non-SUCCESS status",
              activities: [
                ...completedActivities,
                {
                  activityId: activity.id,
                  name: activity.name,
                  status: details.status,
                  details,
                },
              ],
            };
          }
        } else if (isFailed) {
          return {
            ...responseIds,
            status: "failed",
            message: `${activity.name} failed`,
            error: details.error || details.message || "Operation failed",
            activities: [
              ...completedActivities,
              {
                activityId: activity.id,
                name: activity.name,
                status: details.status,
                details,
              },
            ],
          };
        }
      }
      retryCount++;
      if (retryCount >= maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling WiFi network update activity (attempt ${retryCount}/${maxRetries}):`,
        error,
      );
      if (retryCount >= maxRetries) {
        return {
          ...responseIds,
          status: "timeout",
          message: "WiFi network update status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
          activities: completedActivities,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...responseIds,
    status: "timeout",
    message: "WiFi network update status unknown - polling timeout",
    activities: completedActivities,
  };
}

/**
 * Deactivate a WiFi network from one or more venues with automatic retry mechanism
 * This function handles the entire deactivation workflow:
 * 1. Retrieves full network configuration
 * 2. Updates network with empty venues array
 * 3. Resets RADIUS server profile settings
 * 4. Deletes network from each specified venue
 * 5. Polls all operations for completion
 */
export async function deactivateWifiNetworkAtVenuesWithRetry(
  token: string,
  networkId: string,
  venueIds: string[],
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const baseApiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud`
      : "https://api.ruckus.cloud";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // STORY-024: uniform per-venue deactivation for ALL network types — one
  // `DELETE /venues/{venueId}/wifiNetworks/{networkId}` per venue (confirmed by GUI
  // trace). No full-config retrieve, no empty-`venues[]` PUT, and no RADIUS-settings
  // reset (the product does just the DELETE).
  const venueRequestIds: Array<{ id: string; name: string; venueId: string }> =
    [];

  for (const venueId of venueIds) {
    console.log(`[RUCKUS] Deactivating network from venue ${venueId}...`);
    const deleteRequestId = (
      await makeRuckusApiCall(
        {
          method: "delete",
          url: `${baseApiUrl}/venues/${venueId}/wifiNetworks/${networkId}`,
          headers,
        },
        `Deactivate network from venue ${venueId}`,
      )
    ).data.requestId;
    if (deleteRequestId) {
      venueRequestIds.push({
        id: deleteRequestId,
        name: `Deactivate from venue ${venueId}`,
        venueId,
      });
    }
  }

  // Poll all venue deactivations for completion
  let retryCount = 0;
  const completedActivities: any[] = [];

  while (retryCount < maxRetries) {
    try {
      const pendingActivities = venueRequestIds.filter(
        (req) => !completedActivities.find((c) => c.activityId === req.id),
      );

      if (pendingActivities.length === 0) {
        return {
          status: "completed",
          message: `WiFi network deactivated from ${venueIds.length} venue(s) successfully`,
          networkId,
          venueIds,
          venueRequestIds: venueRequestIds.map((v) => ({
            venueId: v.venueId,
            requestId: v.id,
          })),
          activities: completedActivities,
        };
      }

      for (const activity of pendingActivities) {
        const activityDetails = await getRuckusActivityDetails(
          token,
          activity.id,
          region,
        );
        const isCompleted = activityDetails.endDatetime !== undefined;
        const isFailed =
          activityDetails.status !== "SUCCESS" &&
          activityDetails.status !== "INPROGRESS";

        if (isCompleted) {
          if (activityDetails.status === "SUCCESS") {
            console.log(`[RUCKUS] ${activity.name} completed successfully`);
            completedActivities.push({
              activityId: activity.id,
              name: activity.name,
              status: "SUCCESS",
              details: activityDetails,
            });
          } else {
            return {
              status: "failed",
              message: `${activity.name} failed`,
              networkId,
              venueIds,
              error:
                activityDetails.error ||
                activityDetails.message ||
                "Operation completed with non-SUCCESS status",
              activities: [
                ...completedActivities,
                {
                  activityId: activity.id,
                  name: activity.name,
                  status: activityDetails.status,
                  details: activityDetails,
                },
              ],
            };
          }
        } else if (isFailed) {
          return {
            status: "failed",
            message: `${activity.name} failed`,
            networkId,
            venueIds,
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation failed",
            activities: [
              ...completedActivities,
              {
                activityId: activity.id,
                name: activity.name,
                status: activityDetails.status,
                details: activityDetails,
              },
            ],
          };
        }
      }

      retryCount++;
      console.log(
        `[RUCKUS] WiFi network deactivation in progress, attempt ${retryCount}/${maxRetries} (${pendingActivities.length} operations pending)`,
      );

      if (retryCount >= maxRetries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      if (retryCount >= maxRetries) {
        return {
          status: "timeout",
          message: "WiFi network deactivation status unknown - polling timeout",
          networkId,
          venueIds,
          error: "Failed to get activity status after maximum retries",
          activities: completedActivities,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    status: "timeout",
    message: "WiFi network deactivation status unknown - polling timeout",
    networkId,
    venueIds,
    activities: completedActivities,
  };
}

export async function deleteWifiNetworkWithRetry(
  token: string,
  networkId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks/${networkId}`
      : `https://api.ruckus.cloud/wifiNetworks/${networkId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete WiFi network",
  );

  const deleteResponse = response.data;

  // Always get requestId for async tracking (delete operations always return requestId)
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    throw new Error("No requestId returned from WiFi network deletion API");
  }

  // Poll for completion status
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...deleteResponse,
            activityDetails,
            status: "completed",
            message: "WiFi network deleted successfully",
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: "failed",
            message: "WiFi network deletion failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: "failed",
          message: "WiFi network deletion failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] WiFi network deletion in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message: "WiFi network deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "WiFi network deletion status unknown - polling timeout",
    activityId,
  };
}

/**
 * Query guest passes from RUCKUS One with filtering and pagination support
 */
export async function queryGuestPasses(
  token: string,
  region: string = "",
  filters: any = {},
  fields: string[] = [
    "creationDate",
    "name",
    "passDurationHours",
    "id",
    "wifiNetworkId",
    "maxNumberOfClients",
    "notes",
    "clients",
    "guestStatus",
    "emailAddress",
    "mobilePhoneNumber",
    "guestType",
    "ssid",
    "socialLogin",
    "expiryDate",
    "cog",
    "hostApprovalEmail",
    "devicesMac",
  ],
  searchString: string = "",
  searchTargetFields: string[] = ["name", "mobilePhoneNumber", "emailAddress"],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = "name",
  sortOrder: string = "ASC",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/guestUsers/query`
      : "https://api.ruckus.cloud/guestUsers/query";

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
    searchTargetFields,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query guest passes",
  );

  return response.data;
}

/**
 * Create a guest pass credential for a WiFi network with automatic retry mechanism
 * This function handles the guest pass creation workflow with polling for completion status
 */
export async function createGuestPassWithRetry(
  token: string,
  networkId: string,
  guestPassData: {
    name: string;
    expiration: {
      duration: number;
      unit: "Hour" | "Day" | "Week" | "Month";
      activationType: "Creation" | "FirstUse";
    };
    maxDevices: number;
    deliveryMethods: ("PRINT" | "EMAIL" | "SMS")[];
    mobilePhoneNumber?: string | null;
    email?: string;
    notes?: string;
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks/${networkId}/guestUsers`
      : `https://api.ruckus.cloud/wifiNetworks/${networkId}/guestUsers`;

  const payload = {
    name: guestPassData.name,
    mobilePhoneNumber: guestPassData.mobilePhoneNumber || null,
    email: guestPassData.email || "",
    notes: guestPassData.notes || "",
    expiration: guestPassData.expiration,
    maxDevices: guestPassData.maxDevices,
    deliveryMethods: guestPassData.deliveryMethods,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create guest pass",
  );

  const createResponse = response.data;

  // Always get requestId for async tracking (create operations always return requestId)
  const activityId = createResponse.requestId;

  if (!activityId) {
    throw new Error("No requestId returned from guest pass creation API");
  }

  // Poll for completion status
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...createResponse,
            activityDetails,
            status: "completed",
            message: "Guest pass created successfully",
          };
        } else {
          return {
            ...createResponse,
            activityDetails,
            status: "failed",
            message: "Guest pass creation failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...createResponse,
          activityDetails,
          status: "failed",
          message: "Guest pass creation failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] Guest pass creation in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...createResponse,
          status: "timeout",
          message: "Guest pass creation status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "Guest pass creation status unknown - polling timeout",
    activityId,
  };
}

/**
 * Delete a guest pass from a WiFi network with automatic retry mechanism
 * This function handles the guest pass deletion workflow with polling for completion status
 */
export async function deleteGuestPassWithRetry(
  token: string,
  networkId: string,
  guestPassId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/wifiNetworks/${networkId}/guestUsers/${guestPassId}`
      : `https://api.ruckus.cloud/wifiNetworks/${networkId}/guestUsers/${guestPassId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete guest pass",
  );

  const deleteResponse = response.data;

  // Check if this is an async operation (has requestId)
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    // If no requestId, it's a synchronous operation, return immediately
    return {
      ...deleteResponse,
      status: "completed",
      message: "Guest pass deleted successfully (synchronous operation)",
    };
  }

  // Poll for completion status (async operation)
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const activityDetails = await getRuckusActivityDetails(
        token,
        activityId,
        region,
      );

      // Check if operation is completed (has endDatetime populated)
      const isCompleted = activityDetails.endDatetime !== undefined;

      // Check if operation failed (status is not SUCCESS or INPROGRESS)
      const isFailed =
        activityDetails.status !== "SUCCESS" &&
        activityDetails.status !== "INPROGRESS";

      if (isCompleted) {
        // Check if it completed successfully
        if (activityDetails.status === "SUCCESS") {
          return {
            ...deleteResponse,
            activityDetails,
            status: "completed",
            message: "Guest pass deleted successfully",
          };
        } else {
          return {
            ...deleteResponse,
            activityDetails,
            status: "failed",
            message: "Guest pass deletion failed",
            error:
              activityDetails.error ||
              activityDetails.message ||
              "Operation completed with non-SUCCESS status",
          };
        }
      }

      if (isFailed) {
        return {
          ...deleteResponse,
          activityDetails,
          status: "failed",
          message: "Guest pass deletion failed",
          error:
            activityDetails.error || activityDetails.message || "Unknown error",
        };
      }

      // If still in progress, increment retry count and continue
      retryCount++;
      console.log(
        `[RUCKUS] Guest pass deletion in progress, attempt ${retryCount}/${maxRetries}`,
      );

      // If we've reached max retries, exit loop
      if (retryCount >= maxRetries) {
        break;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      retryCount++;
      console.error(
        `[RUCKUS] Error polling activity details (attempt ${retryCount}/${maxRetries}):`,
        error,
      );

      // If we've reached max retries, return error
      if (retryCount >= maxRetries) {
        return {
          ...deleteResponse,
          status: "timeout",
          message: "Guest pass deletion status unknown - polling timeout",
          error: "Failed to get activity status after maximum retries",
        };
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "Guest pass deletion status unknown - polling timeout",
    activityId,
  };
}

export async function queryClients(
  token: string,
  region: string = "",
  filters: any = {},
  fields: string[] = [
    "modelName",
    "deviceType",
    "osType",
    "username",
    "hostname",
    "macAddress",
    "ipAddress",
    "ipv6Address",
    "mldMacAddress",
    "cpeMacAddress",
    "connectedTime",
    "lastUpdatedTime",
    "venueInformation",
    "apInformation",
    "networkInformation",
    "switchInformation",
    "signalStatus",
    "radioStatus",
    "trafficStatus",
    "authenticationStatus",
    "band",
    "identityId",
    "identityName",
    "identityGroupId",
    "identityGroupName",
  ],
  searchString: string = "",
  searchTargetFields: string[] = [
    "macAddress",
    "mldMacAddress",
    "ipAddress",
    "username",
    "hostname",
    "osType",
    "networkInformation.ssid",
    "networkInformation.vni",
    "networkInformation.vlan",
  ],
  page: number = 1,
  pageSize: number = 10,
  sortField: string = "name",
  sortOrder: string = "ASC",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/aps/clients/query`
      : `https://api.ruckus.cloud/venues/aps/clients/query`;

  const payload = {
    searchString,
    searchTargetFields,
    fields,
    filters,
    page,
    pageSize,
    defaultPageSize: 10,
    total: 0,
    sortField,
    sortOrder,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query clients",
  );

  return response.data;
}

// ==================== Identity Group Operations ====================

export async function createIdentityGroupWithRetry(
  token: string,
  name: string,
  autoCleanupEnabled: boolean = true,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/identityGroups`
      : "https://api.ruckus.cloud/identityGroups";

  const payload = {
    name,
    autoCleanupEnabled,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create identity group",
  );

  const createResponse = response.data;
  const activityId = createResponse.requestId;

  if (!activityId) {
    return {
      ...createResponse,
      status: "completed",
      message: "Identity group created successfully (synchronous operation)",
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `[RUCKUS] Polling identity group creation attempt ${attempt}/${maxRetries}...`,
    );
    const activityDetails = await getRuckusActivityDetails(
      token,
      activityId,
      region,
    );

    if (
      activityDetails.status === "COMPLETED" ||
      activityDetails.status === "SUCCESS"
    ) {
      return {
        ...createResponse,
        activityDetails,
        status: "completed",
        message: "Identity group created successfully",
      };
    }

    if (activityDetails.status === "FAIL") {
      return {
        ...createResponse,
        activityDetails,
        status: "failed",
        message: "Identity group creation failed",
        error:
          activityDetails.error ||
          activityDetails.message ||
          "Operation failed",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "Identity group creation status unknown - polling timeout",
  };
}

export async function queryIdentityGroups(
  token: string,
  region: string = "",
  keyword: string = "",
  page: number = 1,
  pageSize: number = 10000,
  sortField: string = "name",
  sortOrder: string = "ASC",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/identityGroups/query?size=${pageSize}&page=${page - 1}&sort=${sortField},${sortOrder.toLowerCase()}`
      : `https://api.ruckus.cloud/identityGroups/query?size=${pageSize}&page=${page - 1}&sort=${sortField},${sortOrder.toLowerCase()}`;

  const payload: any = {
    page,
    pageSize,
    sortField,
    sortOrder,
  };

  if (keyword && keyword.trim() !== "") {
    payload.keyword = keyword;
  }

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query identity groups",
  );

  return response.data;
}

export async function deleteIdentityGroupWithRetry(
  token: string,
  identityGroupId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/identityGroups/${identityGroupId}`
      : `https://api.ruckus.cloud/identityGroups/${identityGroupId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete identity group",
  );

  const deleteResponse = response.data;
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    return {
      ...deleteResponse,
      status: "completed",
      message: "Identity group deleted successfully (synchronous operation)",
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `[RUCKUS] Polling identity group deletion attempt ${attempt}/${maxRetries}...`,
    );
    const activityDetails = await getRuckusActivityDetails(
      token,
      activityId,
      region,
    );

    if (
      activityDetails.status === "COMPLETED" ||
      activityDetails.status === "SUCCESS"
    ) {
      return {
        ...deleteResponse,
        activityDetails,
        status: "completed",
        message: "Identity group deleted successfully",
      };
    }

    if (activityDetails.status === "FAIL") {
      return {
        ...deleteResponse,
        activityDetails,
        status: "failed",
        message: "Identity group deletion failed",
        error:
          activityDetails.error ||
          activityDetails.message ||
          "Operation failed",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "Identity group deletion status unknown - polling timeout",
  };
}

// ==================== DPSK Service Operations ====================

export async function createDpskServiceWithRetry(
  token: string,
  identityGroupId: string,
  name: string,
  passphraseFormat: string = "MOST_SECURED",
  passphraseLength: number = 18,
  autoNotificationsEnabled: boolean = false,
  expirationType: string | null = null,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/identityGroups/${identityGroupId}/dpskServices`
      : `https://api.ruckus.cloud/identityGroups/${identityGroupId}/dpskServices`;

  const payload: any = {
    name,
    passphraseFormat,
    passphraseLength,
    autoNotificationsEnabled,
    expirationType,
  };

  const response = await makeRuckusApiCall(
    {
      method: "post",
      url: apiUrl,
      data: payload,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Create DPSK service",
  );

  const createResponse = response.data;
  const activityId = createResponse.requestId;

  if (!activityId) {
    return {
      ...createResponse,
      status: "completed",
      message: "DPSK service created successfully (synchronous operation)",
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `[RUCKUS] Polling DPSK service creation attempt ${attempt}/${maxRetries}...`,
    );
    const activityDetails = await getRuckusActivityDetails(
      token,
      activityId,
      region,
    );

    if (
      activityDetails.status === "COMPLETED" ||
      activityDetails.status === "SUCCESS"
    ) {
      return {
        ...createResponse,
        activityDetails,
        status: "completed",
        message: "DPSK service created successfully",
      };
    }

    if (activityDetails.status === "FAIL") {
      return {
        ...createResponse,
        activityDetails,
        status: "failed",
        message: "DPSK service creation failed",
        error:
          activityDetails.error ||
          activityDetails.message ||
          "Operation failed",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    ...createResponse,
    status: "timeout",
    message: "DPSK service creation status unknown - polling timeout",
  };
}

export async function queryDpskServices(
  token: string,
  region: string = "",
  page: number = 0,
  pageSize: number = 10000,
  sortField: string = "name",
  sortOrder: string = "asc",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/dpskServices?size=${pageSize}&page=${page}&sort=${sortField},${sortOrder}`
      : `https://api.ruckus.cloud/dpskServices?size=${pageSize}&page=${page}&sort=${sortField},${sortOrder}`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Query DPSK services",
  );

  return response.data;
}

export async function deleteDpskServiceWithRetry(
  token: string,
  dpskServiceId: string,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/dpskServices/${dpskServiceId}`
      : `https://api.ruckus.cloud/dpskServices/${dpskServiceId}`;

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete DPSK service",
  );

  const deleteResponse = response.data;
  const activityId = deleteResponse.requestId;

  if (!activityId) {
    return {
      ...deleteResponse,
      status: "completed",
      message: "DPSK service deleted successfully (synchronous operation)",
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `[RUCKUS] Polling DPSK service deletion attempt ${attempt}/${maxRetries}...`,
    );
    const activityDetails = await getRuckusActivityDetails(
      token,
      activityId,
      region,
    );

    if (
      activityDetails.status === "COMPLETED" ||
      activityDetails.status === "SUCCESS"
    ) {
      return {
        ...deleteResponse,
        activityDetails,
        status: "completed",
        message: "DPSK service deleted successfully",
      };
    }

    if (activityDetails.status === "FAIL") {
      return {
        ...deleteResponse,
        activityDetails,
        status: "failed",
        message: "DPSK service deletion failed",
        error:
          activityDetails.error ||
          activityDetails.message ||
          "Operation failed",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    ...deleteResponse,
    status: "timeout",
    message: "DPSK service deletion status unknown - polling timeout",
  };
}

// ==================== Venue WiFi Network Settings Operations ====================

export async function getVenueWifiNetworkSettings(
  token: string,
  venueId: string,
  wifiNetworkId: string,
  region: string = "",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/wifiNetworks/${wifiNetworkId}/settings`
      : `https://api.ruckus.cloud/venues/${venueId}/wifiNetworks/${wifiNetworkId}/settings`;

  const response = await makeRuckusApiCall(
    {
      method: "get",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.ruckus.v1+json",
        "Content-Type": "application/json",
      },
    },
    "Get venue WiFi network settings",
  );

  return response.data;
}

export async function updateVenueWifiNetworkSettingsWithRetry(
  token: string,
  venueId: string,
  wifiNetworkId: string,
  settings: any,
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/venues/${venueId}/wifiNetworks/${wifiNetworkId}/settings`
      : `https://api.ruckus.cloud/venues/${venueId}/wifiNetworks/${wifiNetworkId}/settings`;

  const response = await makeRuckusApiCall(
    {
      method: "put",
      url: apiUrl,
      data: settings,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.ruckus.v1+json",
        "Content-Type": "application/vnd.ruckus.v1+json",
      },
    },
    "Update venue WiFi network settings",
  );

  const updateResponse = response.data;
  const activityId = updateResponse.requestId;

  if (!activityId) {
    return {
      ...updateResponse,
      status: "completed",
      message:
        "Venue WiFi network settings updated successfully (synchronous operation)",
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `[RUCKUS] Polling venue WiFi network settings update attempt ${attempt}/${maxRetries}...`,
    );
    const activityDetails = await getRuckusActivityDetails(
      token,
      activityId,
      region,
    );

    if (
      activityDetails.status === "COMPLETED" ||
      activityDetails.status === "SUCCESS"
    ) {
      return {
        ...updateResponse,
        activityDetails,
        status: "completed",
        message: "Venue WiFi network settings updated successfully",
      };
    }

    if (activityDetails.status === "FAIL") {
      return {
        ...updateResponse,
        activityDetails,
        status: "failed",
        message: "Venue WiFi network settings update failed",
        error:
          activityDetails.error ||
          activityDetails.message ||
          "Operation failed",
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    ...updateResponse,
    status: "timeout",
    message:
      "Venue WiFi network settings update status unknown - polling timeout",
  };
}

// ============================================================================
// SMS PROVIDER (Twilio)
// ============================================================================

export async function getSmsProvider(
  token: string,
  region: string = "",
): Promise<any> {
  const baseUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud`
      : "https://api.ruckus.cloud";

  const [brandResp, twilioResp] = await Promise.all([
    makeRuckusApiCall(
      {
        method: "get",
        url: `${baseUrl}/notifications/sms`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      "Get SMS brand settings",
    ),
    makeRuckusApiCall(
      {
        method: "get",
        url: `${baseUrl}/notifications/sms/providers/twilios`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      "Get Twilio provider settings",
    ),
  ]);

  return { brand: brandResp.data, twilio: twilioResp.data };
}

export async function createSmsProviderWithRetry(
  token: string,
  config: {
    provider?: "TWILIO";
    brandName?: string;
    threshold?: number;
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enableWhatsapp?: boolean;
    authTemplateSid?: string;
  },
  region: string = "",
  maxRetries: number = 20,
  pollIntervalMs: number = 5000,
): Promise<any> {
  const baseUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud`
      : "https://api.ruckus.cloud";

  const provider = config.provider ?? "TWILIO";
  const enableWhatsapp = config.enableWhatsapp === true;

  if (enableWhatsapp && !config.authTemplateSid) {
    throw new Error(
      "authTemplateSid is required when enableWhatsapp=true. Use the Twilio console or the UI dropdown to obtain the approved WhatsApp authentication template SID (HX...).",
    );
  }
  if (config.authTemplateSid !== undefined && !enableWhatsapp) {
    throw new Error(
      "authTemplateSid requires enableWhatsapp=true; it has no effect when WhatsApp is disabled.",
    );
  }

  // Step 1: Save brand + SMS pool threshold
  const brandResp = await makeRuckusApiCall(
    {
      method: "post",
      url: `${baseUrl}/notifications/sms`,
      data: {
        threshold: config.threshold ?? 80,
        provider,
        brandName: config.brandName ?? "",
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Save SMS brand",
  );
  const brandRequestId = brandResp.data?.requestId;

  // Step 2: Save Twilio provider credentials + messaging config
  const twilioResp = await makeRuckusApiCall(
    {
      method: "post",
      url: `${baseUrl}/notifications/sms/providers/twilios`,
      data: {
        accountSid: config.accountSid,
        authToken: config.authToken,
        fromNumber: config.fromNumber,
        enableWhatsapp,
        authTemplateSid: enableWhatsapp ? config.authTemplateSid : null,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Save Twilio provider",
  );
  const twilioRequestId = twilioResp.data?.requestId;

  const requestIds = [
    ...(brandRequestId
      ? [{ id: brandRequestId, name: "Save SMS brand" }]
      : []),
    ...(twilioRequestId
      ? [{ id: twilioRequestId, name: "Save Twilio provider" }]
      : []),
  ];

  if (requestIds.length === 0) {
    return {
      brandResponse: brandResp.data,
      twilioResponse: twilioResp.data,
      status: "completed",
      message: "SMS provider saved successfully (synchronous operation)",
    };
  }

  let retryCount = 0;
  const completedActivities: any[] = [];

  while (retryCount < maxRetries) {
    try {
      const pendingActivities = requestIds.filter(
        (req) => !completedActivities.find((c) => c.activityId === req.id),
      );

      if (pendingActivities.length === 0) {
        return {
          brandRequestId,
          twilioRequestId,
          status: "completed",
          message: "SMS provider saved successfully",
          activities: completedActivities,
        };
      }

      for (const activity of pendingActivities) {
        const activityDetails = await getRuckusActivityDetails(
          token,
          activity.id,
          region,
        );

        const isCompleted = activityDetails.endDatetime !== undefined;

        if (isCompleted) {
          if (
            activityDetails.status === "SUCCESS" ||
            activityDetails.status === "COMPLETED"
          ) {
            completedActivities.push({
              activityId: activity.id,
              name: activity.name,
              status: activityDetails.status,
              details: activityDetails,
            });
          } else {
            return {
              brandRequestId,
              twilioRequestId,
              status: "failed",
              message: `${activity.name} failed with status: ${activityDetails.status}`,
              failedActivity: {
                activityId: activity.id,
                name: activity.name,
                status: activityDetails.status,
                details: activityDetails,
              },
              completedActivities,
            };
          }
        }
      }

      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    } catch (error: any) {
      console.error(
        `Error polling SMS provider activities (attempt ${retryCount + 1}): ${error}`,
      );
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }
  }

  return {
    brandRequestId,
    twilioRequestId,
    status: "timeout",
    message: "SMS provider save status unknown - polling timeout",
    completedActivities,
  };
}

export async function deleteSmsProvider(
  token: string,
  region: string = "",
): Promise<any> {
  const apiUrl =
    region && region.trim() !== ""
      ? `https://api.${region}.ruckus.cloud/notifications/sms/providers/twilios`
      : "https://api.ruckus.cloud/notifications/sms/providers/twilios";

  const response = await makeRuckusApiCall(
    {
      method: "delete",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "Delete Twilio provider",
  );

  // DELETE returns plain text ("Twilio configuration deleted successfully.")
  // — wrap it so callers see a consistent JSON-shaped response.
  const message =
    typeof response.data === "string"
      ? response.data
      : "Twilio configuration deleted successfully.";

  return { status: "completed", message };
}
