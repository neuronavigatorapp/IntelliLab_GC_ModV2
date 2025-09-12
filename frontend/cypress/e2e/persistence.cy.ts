/**
 * E2E Tests for IntelliLab GC Persistence (Pass 1)
 * Tests data persistence, backup functionality, and restart scenarios
 */

describe('IntelliLab GC Persistence Tests', () => {
  const baseUrl = 'http://localhost:8000';
  const apiBaseUrl = `${baseUrl}/api/v1`;

  before(() => {
    // Ensure clean test environment
    cy.request('POST', `${apiBaseUrl}/system/migrate`);
  });

  beforeEach(() => {
    // Visit home page before each test
    cy.visit(baseUrl);
  });

  describe('Data Persistence', () => {
    it('should persist method creation across page reloads', () => {
      const testMethodName = `Test Method ${Date.now()}`;
      
      // Navigate to methods page
      cy.contains('Methods').click();
      
      // Create a new method via API (simulating UI interaction)
      cy.request('POST', `${apiBaseUrl}/methods`, {
        name: testMethodName,
        description: 'E2E test method for persistence',
        method_type: 'test',
        parameters: {
          test_param: 'test_value'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.name).to.eq(testMethodName);
        
        // Reload the page
        cy.reload();
        
        // Verify method still appears (should load from database)
        cy.request('GET', `${apiBaseUrl}/methods`).then((getResponse) => {
          const methods = getResponse.body;
          const createdMethod = methods.find((m: any) => m.name === testMethodName);
          expect(createdMethod).to.not.be.undefined;
          expect(createdMethod.description).to.eq('E2E test method for persistence');
        });
      });
    });

    it('should persist compound data across browser sessions', () => {
      const testCompoundName = `Test Compound ${Date.now()}`;
      
      // Create compound via API
      cy.request('POST', `${apiBaseUrl}/compounds`, {
        name: testCompoundName,
        category: 'Test',
        retention_time: 2.5,
        molecular_weight: 100.0,
        default_intensity: 150.0,
        default_width: 0.2
      }).then((response) => {
        expect(response.status).to.eq(200);
        
        // Clear browser storage to simulate new session
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.clearAllSessionStorage();
        
        // Reload and verify compound still exists in database
        cy.visit(baseUrl);
        cy.request('GET', `${apiBaseUrl}/compounds`).then((getResponse) => {
          const compounds = getResponse.body;
          const createdCompound = compounds.find((c: any) => c.name === testCompoundName);
          expect(createdCompound).to.not.be.undefined;
          expect(createdCompound.retention_time).to.eq(2.5);
          expect(createdCompound.molecular_weight).to.eq(100.0);
        });
      });
    });

    it('should persist sandbox run history', () => {
      // Create a sandbox run
      cy.request('POST', `${apiBaseUrl}/sandbox/run`, {
        instrument_id: 1,
        method_id: 1,
        compound_ids: [1, 2],
        fault_params: {},
        sample_name: `E2E Test Run ${Date.now()}`
      }).then((response) => {
        expect(response.status).to.eq(200);
        const runId = response.body.run_id;
        
        // Verify run is stored in history
        cy.request('GET', `${apiBaseUrl}/sandbox/runs`).then((historyResponse) => {
          expect(historyResponse.status).to.eq(200);
          const runs = historyResponse.body.runs;
          const testRun = runs.find((r: any) => r.id === runId);
          expect(testRun).to.not.be.undefined;
        });
      });
    });
  });

  describe('Backup Functionality', () => {
    it('should create backup successfully', () => {
      // Test backup creation via API
      cy.request('POST', `${apiBaseUrl}/system/backup`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.include('successfully');
      });
    });

    it('should list backups after creation', () => {
      // Create a backup first
      cy.request('POST', `${apiBaseUrl}/system/backup`);
      
      // List backups
      cy.request('GET', `${apiBaseUrl}/system/backup/list`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.backups).to.be.an('array');
        expect(response.body.backups.length).to.be.greaterThan(0);
        
        // Verify backup file structure
        const backup = response.body.backups[0];
        expect(backup).to.have.property('filename');
        expect(backup).to.have.property('size');
        expect(backup).to.have.property('created');
        expect(backup.filename).to.include('intellilab_backup_');
      });
    });

    it('should show backup functionality in Settings UI', () => {
      // Navigate to settings page
      cy.visit(`${baseUrl}/settings`);
      
      // Check if Settings page loads
      cy.contains('System Settings').should('be.visible');
      cy.contains('Backup Management').should('be.visible');
      
      // Check backup creation button
      cy.contains('Create Backup').should('be.visible');
      
      // Check system health display
      cy.contains('System Health').should('be.visible');
    });
  });

  describe('System Health Monitoring', () => {
    it('should report healthy system status', () => {
      cy.request('GET', `${apiBaseUrl}/system/health`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.status).to.be.oneOf(['healthy', 'degraded']);
        expect(response.body.database).to.have.property('accessible');
        expect(response.body.database.accessible).to.be.true;
      });
    });

    it('should provide data location information', () => {
      cy.request('GET', `${apiBaseUrl}/system/data-location`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.location).to.have.property('database_path');
        expect(response.body.location).to.have.property('backup_directory');
        expect(response.body.location.database_exists).to.be.true;
      });
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save method changes', () => {
      // Create a test method
      cy.request('POST', `${apiBaseUrl}/methods`, {
        name: 'Auto-Save Test Method',
        description: 'Original description',
        method_type: 'test',
        parameters: { test: true }
      }).then((response) => {
        const methodId = response.body.id;
        
        // Update the method
        cy.request('PUT', `${apiBaseUrl}/methods/${methodId}`, {
          name: 'Auto-Save Test Method',
          description: 'Updated description via auto-save',
          method_type: 'test',
          parameters: { test: true, updated: true }
        });
        
        // Verify update persisted
        cy.request('GET', `${apiBaseUrl}/methods/${methodId}`).then((getResponse) => {
          expect(getResponse.body.description).to.eq('Updated description via auto-save');
          expect(getResponse.body.parameters.updated).to.be.true;
        });
      });
    });
  });

  describe('Quick-Run Persistence', () => {
    it('should persist quick-run results', () => {
      // Perform a quick-run
      cy.request('POST', `${apiBaseUrl}/chromatography/quick-run`, null, {
        qs: {
          instrument_id: 1,
          method_id: 1,
          sample_name: 'E2E Quick Run Test'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('time');
        expect(response.body).to.have.property('signal');
        
        // Check if run was stored in sandbox history
        cy.request('GET', `${apiBaseUrl}/sandbox/runs`).then((historyResponse) => {
          const runs = historyResponse.body.runs;
          const quickRun = runs.find((r: any) => r.sample_name === 'E2E Quick Run Test');
          expect(quickRun).to.not.be.undefined;
        });
      });
    });
  });

  describe('Application Restart Simulation', () => {
    it('should maintain data integrity after simulated restart', () => {
      const testData = {
        methodName: `Restart Test Method ${Date.now()}`,
        compoundName: `Restart Test Compound ${Date.now()}`,
        sampleName: `Restart Test Sample ${Date.now()}`
      };

      // Create test data
      cy.request('POST', `${apiBaseUrl}/methods`, {
        name: testData.methodName,
        description: 'Pre-restart test method',
        method_type: 'test',
        parameters: { restart_test: true }
      });

      cy.request('POST', `${apiBaseUrl}/compounds`, {
        name: testData.compoundName,
        category: 'Test',
        retention_time: 1.23,
        molecular_weight: 50.0
      });

      cy.request('POST', `${apiBaseUrl}/sandbox/run`, {
        instrument_id: 1,
        method_id: 1,
        compound_ids: [1],
        fault_params: {},
        sample_name: testData.sampleName
      });

      // Simulate application restart by clearing browser state
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      
      // Revisit application
      cy.visit(baseUrl);
      cy.wait(2000); // Allow time for application to initialize

      // Verify all data persisted after "restart"
      cy.request('GET', `${apiBaseUrl}/methods`).then((response) => {
        const methods = response.body;
        const testMethod = methods.find((m: any) => m.name === testData.methodName);
        expect(testMethod).to.not.be.undefined;
        expect(testMethod.description).to.eq('Pre-restart test method');
      });

      cy.request('GET', `${apiBaseUrl}/compounds`).then((response) => {
        const compounds = response.body;
        const testCompound = compounds.find((c: any) => c.name === testData.compoundName);
        expect(testCompound).to.not.be.undefined;
        expect(testCompound.retention_time).to.eq(1.23);
      });

      cy.request('GET', `${apiBaseUrl}/sandbox/runs`).then((response) => {
        const runs = response.body.runs;
        const testRun = runs.find((r: any) => r.sample_name === testData.sampleName);
        expect(testRun).to.not.be.undefined;
      });
    });
  });

  describe('Database Migration', () => {
    it('should handle database migration successfully', () => {
      cy.request('POST', `${apiBaseUrl}/system/migrate`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.include('migration completed');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Test with invalid method creation
      cy.request({
        method: 'POST',
        url: `${apiBaseUrl}/methods`,
        body: {
          // Missing required fields
          description: 'Invalid method'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
      });
    });

    it('should handle database connectivity issues gracefully', () => {
      // Test system health when database might have issues
      cy.request('GET', `${apiBaseUrl}/system/health`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status');
        // Status should be healthy, degraded, or unhealthy
        expect(['healthy', 'degraded', 'unhealthy']).to.include(response.body.status);
      });
    });
  });

  // Cleanup after all tests
  after(() => {
    // Optional: Clean up test data
    // Note: In a real environment, you might want to preserve data
    // or use a separate test database
  });
});
