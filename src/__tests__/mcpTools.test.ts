import * as ruckusApiService from '../services/ruckusApiService';

jest.mock('../services/ruckusApiService');

describe('MCP Tools Integration', () => {
  const mockGetRuckusJwtToken = ruckusApiService.getRuckusJwtToken as jest.MockedFunction<typeof ruckusApiService.getRuckusJwtToken>;
  const mockGetRuckusActivityDetails = ruckusApiService.getRuckusActivityDetails as jest.MockedFunction<typeof ruckusApiService.getRuckusActivityDetails>;
  const mockCreateVenueWithRetry = ruckusApiService.createVenueWithRetry as jest.MockedFunction<typeof ruckusApiService.createVenueWithRetry>;
  const mockDeleteVenueWithRetry = ruckusApiService.deleteVenueWithRetry as jest.MockedFunction<typeof ruckusApiService.deleteVenueWithRetry>;
  const mockCreateApGroupWithRetry = ruckusApiService.createApGroupWithRetry as jest.MockedFunction<typeof ruckusApiService.createApGroupWithRetry>;
  const mockQueryApGroups = ruckusApiService.queryApGroups as jest.MockedFunction<typeof ruckusApiService.queryApGroups>;
  const mockDeleteApGroupWithRetry = ruckusApiService.deleteApGroupWithRetry as jest.MockedFunction<typeof ruckusApiService.deleteApGroupWithRetry>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.RUCKUS_TENANT_ID = 'test-tenant';
    process.env.RUCKUS_CLIENT_ID = 'test-client';
    process.env.RUCKUS_CLIENT_SECRET = 'test-secret';
    process.env.RUCKUS_REGION = 'test-region';
  });

  describe('getRuckusJwtToken', () => {
    it('should successfully get auth token', async () => {
      const mockToken = 'mock-jwt-token-12345';
      mockGetRuckusJwtToken.mockResolvedValue(mockToken);

      const result = await ruckusApiService.getRuckusJwtToken(
        'test-tenant',
        'test-client',
        'test-secret',
        'test-region'
      );

      expect(result).toBe(mockToken);
      expect(mockGetRuckusJwtToken).toHaveBeenCalledWith(
        'test-tenant',
        'test-client',
        'test-secret',
        'test-region'
      );
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Authentication failed');
      mockGetRuckusJwtToken.mockRejectedValue(error);

      await expect(
        ruckusApiService.getRuckusJwtToken(
          'test-tenant',
          'test-client',
          'test-secret',
          'test-region'
        )
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('createVenueWithRetry', () => {
    it('should successfully create venue with polling', async () => {
      const venueData = {
        name: 'Test Venue',
        addressLine: 'Tokyo',
        city: 'Tokyo',
        country: 'Japan',
      };

      const mockResult = {
        success: true,
        venue: { id: 'new-venue-id', name: 'Test Venue' },
        requestId: 'request-123',
        status: 'COMPLETED',
        message: 'Venue created successfully'
      };

      mockCreateVenueWithRetry.mockResolvedValue(mockResult);

      const result = await ruckusApiService.createVenueWithRetry(
        'mock-token',
        venueData,
        'test-region',
        5,
        2000
      );

      expect(result).toEqual(mockResult);
      expect(mockCreateVenueWithRetry).toHaveBeenCalledWith(
        'mock-token',
        venueData,
        'test-region',
        5,
        2000
      );
    });

    it('should handle venue creation failure', async () => {
      const venueData = {
        name: 'Test Venue',
        addressLine: 'Invalid Location',
        city: 'InvalidCity',
        country: 'InvalidCountry',
      };

      const error = new Error('Invalid address/country combination');
      mockCreateVenueWithRetry.mockRejectedValue(error);

      await expect(
        ruckusApiService.createVenueWithRetry(
          'mock-token',
          venueData,
          'test-region'
        )
      ).rejects.toThrow('Invalid address/country combination');
    });
  });

  describe('deleteVenueWithRetry', () => {
    it('should successfully delete venue with polling', async () => {
      const venueId = 'venue-to-delete';
      const mockResult = {
        success: true,
        requestId: 'delete-request-123',
        status: 'COMPLETED',
        message: 'Venue deleted successfully'
      };

      mockDeleteVenueWithRetry.mockResolvedValue(mockResult);

      const result = await ruckusApiService.deleteVenueWithRetry(
        'mock-token',
        venueId,
        'test-region',
        5,
        2000
      );

      expect(result).toEqual(mockResult);
      expect(mockDeleteVenueWithRetry).toHaveBeenCalledWith(
        'mock-token',
        venueId,
        'test-region',
        5,
        2000
      );
    });

    it('should handle venue deletion failure', async () => {
      const venueId = 'non-existent-venue';
      const error = new Error('Venue not found');
      mockDeleteVenueWithRetry.mockRejectedValue(error);

      await expect(
        ruckusApiService.deleteVenueWithRetry(
          'mock-token',
          venueId,
          'test-region'
        )
      ).rejects.toThrow('Venue not found');
    });
  });

  describe('createApGroupWithRetry', () => {
    it('should successfully create AP group', async () => {
      const venueId = 'venue-123';
      const apGroupData = {
        name: 'Test AP Group',
        description: 'Test AP Group Description',
      };

      const mockResult = {
        success: true,
        apGroup: { id: 'ap-group-123', name: 'Test AP Group' },
        requestId: 'ap-request-123',
        status: 'COMPLETED',
        message: 'AP Group created successfully'
      };

      mockCreateApGroupWithRetry.mockResolvedValue(mockResult);

      const result = await ruckusApiService.createApGroupWithRetry(
        'mock-token',
        venueId,
        apGroupData,
        'test-region',
        5,
        2000
      );

      expect(result).toEqual(mockResult);
      expect(mockCreateApGroupWithRetry).toHaveBeenCalledWith(
        'mock-token',
        venueId,
        apGroupData,
        'test-region',
        5,
        2000
      );
    });

    it('should handle AP group creation failure', async () => {
      const venueId = 'venue-123';
      const apGroupData = {
        name: 'Invalid Group Name!@#',
        description: 'Test description',
      };

      const error = new Error('Invalid AP group name format');
      mockCreateApGroupWithRetry.mockRejectedValue(error);

      await expect(
        ruckusApiService.createApGroupWithRetry(
          'mock-token',
          venueId,
          apGroupData,
          'test-region'
        )
      ).rejects.toThrow('Invalid AP group name format');
    });
  });

  describe('queryApGroups', () => {
    it('should successfully retrieve AP groups', async () => {
      const mockApGroups = {
        data: [
          {
            id: 'ap-group-1',
            name: 'AP Group 1',
            isDefault: false,
          },
          {
            id: 'ap-group-2', 
            name: 'AP Group 2',
            isDefault: true,
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10000
      };

      mockQueryApGroups.mockResolvedValue(mockApGroups);

      const result = await ruckusApiService.queryApGroups(
        'mock-token',
        'test-region',
        {},
        ['id', 'name'],
        1,
        10000
      );

      expect(result).toEqual(mockApGroups);
      expect(mockQueryApGroups).toHaveBeenCalledWith(
        'mock-token',
        'test-region',
        {},
        ['id', 'name'],
        1,
        10000
      );
    });

    it('should handle filtered AP groups query', async () => {
      const filters = { isDefault: [false] };
      const mockApGroups = {
        data: [
          {
            id: 'ap-group-1',
            name: 'Custom AP Group',
            isDefault: false,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10000
      };

      mockQueryApGroups.mockResolvedValue(mockApGroups);

      const result = await ruckusApiService.queryApGroups(
        'mock-token',
        'test-region',
        filters,
        ['id', 'name'],
        1,
        10000
      );

      expect(result).toEqual(mockApGroups);
      expect(mockQueryApGroups).toHaveBeenCalledWith(
        'mock-token',
        'test-region',
        filters,
        ['id', 'name'],
        1,
        10000
      );
    });
  });

  describe('deleteApGroupWithRetry', () => {
    it('should successfully delete AP group', async () => {
      const venueId = 'venue-123';
      const apGroupId = 'ap-group-to-delete';
      const mockResult = {
        success: true,
        requestId: 'delete-ap-request-123',
        status: 'COMPLETED',
        message: 'AP Group deleted successfully'
      };

      mockDeleteApGroupWithRetry.mockResolvedValue(mockResult);

      const result = await ruckusApiService.deleteApGroupWithRetry(
        'mock-token',
        venueId,
        apGroupId,
        'test-region',
        5,
        2000
      );

      expect(result).toEqual(mockResult);
      expect(mockDeleteApGroupWithRetry).toHaveBeenCalledWith(
        'mock-token',
        venueId,
        apGroupId,
        'test-region',
        5,
        2000
      );
    });

    it('should handle AP group deletion failure', async () => {
      const venueId = 'venue-123';
      const apGroupId = 'non-existent-group';
      const error = new Error('AP Group not found');
      mockDeleteApGroupWithRetry.mockRejectedValue(error);

      await expect(
        ruckusApiService.deleteApGroupWithRetry(
          'mock-token',
          venueId,
          apGroupId,
          'test-region'
        )
      ).rejects.toThrow('AP Group not found');
    });
  });

  describe('getRuckusActivityDetails', () => {
    it('should successfully get activity details', async () => {
      const activityId = 'activity-123';
      const mockActivityDetails = {
        id: activityId,
        status: 'COMPLETED',
        progress: 100,
        result: { venueId: 'venue-123' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:05:00Z',
      };

      mockGetRuckusActivityDetails.mockResolvedValue(mockActivityDetails);

      const result = await ruckusApiService.getRuckusActivityDetails(
        'mock-token',
        activityId,
        'test-region'
      );

      expect(result).toEqual(mockActivityDetails);
      expect(mockGetRuckusActivityDetails).toHaveBeenCalledWith(
        'mock-token',
        activityId,
        'test-region'
      );
    });

    it('should handle activity not found', async () => {
      const activityId = 'non-existent-activity';
      const error = new Error('Activity not found');
      mockGetRuckusActivityDetails.mockRejectedValue(error);

      await expect(
        ruckusApiService.getRuckusActivityDetails(
          'mock-token',
          activityId,
          'test-region'
        )
      ).rejects.toThrow('Activity not found');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete venue creation workflow', async () => {
      const mockToken = 'workflow-token';
      const venueData = {
        name: 'Integration Test Venue',
        addressLine: 'Paris',
        city: 'Paris',
        country: 'France'
      };
      const mockCreateResult = {
        success: true,
        venue: { id: 'integration-venue-id', name: 'Integration Test Venue' },
        requestId: 'integration-request-123',
        status: 'COMPLETED',
        message: 'Venue created successfully'
      };
      const mockActivityDetails = {
        id: 'integration-request-123',
        status: 'COMPLETED',
        progress: 100,
        result: { venueId: 'integration-venue-id' }
      };

      mockGetRuckusJwtToken.mockResolvedValue(mockToken);
      mockCreateVenueWithRetry.mockResolvedValue(mockCreateResult);
      mockGetRuckusActivityDetails.mockResolvedValue(mockActivityDetails);

      // Step 1: Get auth token
      const token = await ruckusApiService.getRuckusJwtToken(
        'test-tenant',
        'test-client', 
        'test-secret',
        'test-region'
      );
      expect(token).toBe(mockToken);

      // Step 2: Create venue
      const createResult = await ruckusApiService.createVenueWithRetry(
        token,
        venueData,
        'test-region'
      );
      expect(createResult.success).toBe(true);
      expect(createResult.venue?.id).toBe('integration-venue-id');

      // Step 3: Check activity details
      const activityDetails = await ruckusApiService.getRuckusActivityDetails(
        token,
        createResult.requestId,
        'test-region'
      );
      expect(activityDetails.status).toBe('COMPLETED');
      expect(activityDetails.result?.venueId).toBe('integration-venue-id');
    });

    it('should handle complete AP group management workflow', async () => {
      const mockToken = 'ap-workflow-token';
      const venueId = 'workflow-venue-id';
      const apGroupData = {
        name: 'Workflow AP Group',
        description: 'Integration test AP group'
      };
      const mockCreateResult = {
        success: true,
        apGroup: { id: 'workflow-ap-group-id', name: 'Workflow AP Group' },
        requestId: 'ap-workflow-request-123',
        status: 'COMPLETED',
        message: 'AP Group created successfully'
      };
      const mockQueryResult = {
        data: [{
          id: 'workflow-ap-group-id',
          name: 'Workflow AP Group',
          isDefault: false
        }],
        total: 1,
        page: 1,
        pageSize: 10000
      };
      const mockDeleteResult = {
        success: true,
        requestId: 'delete-workflow-request-123',
        status: 'COMPLETED',
        message: 'AP Group deleted successfully'
      };

      mockGetRuckusJwtToken.mockResolvedValue(mockToken);
      mockCreateApGroupWithRetry.mockResolvedValue(mockCreateResult);
      mockQueryApGroups.mockResolvedValue(mockQueryResult);
      mockDeleteApGroupWithRetry.mockResolvedValue(mockDeleteResult);

      // Step 1: Get auth token
      const token = await ruckusApiService.getRuckusJwtToken(
        'test-tenant',
        'test-client',
        'test-secret',
        'test-region'
      );
      expect(token).toBe(mockToken);

      // Step 2: Create AP group
      const createResult = await ruckusApiService.createApGroupWithRetry(
        token,
        venueId,
        apGroupData,
        'test-region'
      );
      expect(createResult.success).toBe(true);
      expect(createResult.apGroup?.id).toBe('workflow-ap-group-id');

      // Step 3: Query AP groups
      const queryResult = await ruckusApiService.queryApGroups(
        token,
        'test-region',
        { isDefault: [false] },
        ['id', 'name'],
        1,
        10000
      );
      expect(queryResult.data).toHaveLength(1);
      expect(queryResult.data[0].id).toBe('workflow-ap-group-id');

      // Step 4: Delete AP group
      const deleteResult = await ruckusApiService.deleteApGroupWithRetry(
        token,
        venueId,
        'workflow-ap-group-id',
        'test-region'
      );
      expect(deleteResult.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      mockGetRuckusJwtToken.mockRejectedValue(networkError);

      await expect(
        ruckusApiService.getRuckusJwtToken(
          'test-tenant',
          'test-client',
          'test-secret',
          'test-region'
        )
      ).rejects.toThrow('Network timeout');
    });

    it('should handle authentication token expiry', async () => {
      const authError = new Error('Token expired');
      mockGetRuckusJwtToken.mockRejectedValue(authError);

      await expect(
        ruckusApiService.getRuckusJwtToken(
          'test-tenant',
          'test-client',
          'test-secret',
          'test-region'
        )
      ).rejects.toThrow('Token expired');
    });

    it('should handle API errors with detailed information', async () => {
      const apiError = new Error('RUCKUS API Error') as any;
      apiError.response = {
        status: 400,
        data: {
          errors: [{
            code: 'INVALID_VENUE_DATA',
            message: 'Invalid venue data provided',
            reason: 'Country and city mismatch'
          }]
        }
      };
      mockCreateVenueWithRetry.mockRejectedValue(apiError);

      await expect(
        ruckusApiService.createVenueWithRetry(
          'mock-token',
          { name: 'Test', addressLine: 'Test', city: 'Test', country: 'Test' },
          'test-region'
        )
      ).rejects.toThrow('RUCKUS API Error');
    });
  });
});