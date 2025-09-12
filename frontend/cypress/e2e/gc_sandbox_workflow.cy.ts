/// <reference types="cypress" />

describe('GC Sandbox Complete Workflow', () => {
  beforeEach(() => {
    // Visit the application and navigate to GC Sandbox
    cy.visit('/');
    cy.get('[data-cy="master-launcher"]').should('be.visible');
    
    // Navigate to GC Sandbox
    cy.get('[data-cy="gc-sandbox-button"]').click();
    cy.url().should('include', '/sandbox');
    
    // Wait for the component to load
    cy.get('[data-cy="gc-sandbox-container"]').should('be.visible');
  });

  describe('Data Management (CRUD Operations)', () => {
    it('should manage compounds through CRUD operations', () => {
      // Switch to Data Management tab
      cy.get('[data-cy="tab-data-management"]').click();
      
      // Test compound creation
      cy.get('[data-cy="add-compound-button"]').click();
      cy.get('[data-cy="compound-dialog"]').should('be.visible');
      
      // Fill compound form
      cy.get('[data-cy="compound-name-input"]').type('Test Octane');
      cy.get('[data-cy="compound-category-select"]').click();
      cy.get('[data-value="Hydrocarbon"]').click();
      cy.get('[data-cy="compound-retention-time-input"]').clear().type('4.5');
      cy.get('[data-cy="compound-molecular-weight-input"]').clear().type('114.23');
      cy.get('[data-cy="compound-intensity-input"]').clear().type('850');
      cy.get('[data-cy="compound-width-input"]').clear().type('0.12');
      
      // Save compound
      cy.get('[data-cy="compound-save-button"]').click();
      cy.get('[data-cy="compound-dialog"]').should('not.exist');
      
      // Verify compound appears in table
      cy.get('[data-cy="compounds-table"]').should('contain', 'Test Octane');
      
      // Test compound editing
      cy.get('[data-cy="compounds-table"]')
        .contains('Test Octane')
        .parent()
        .within(() => {
          cy.get('[data-cy="edit-compound-button"]').click();
        });
      
      cy.get('[data-cy="compound-dialog"]').should('be.visible');
      cy.get('[data-cy="compound-retention-time-input"]').clear().type('4.7');
      cy.get('[data-cy="compound-save-button"]').click();
      cy.get('[data-cy="compound-dialog"]').should('not.exist');
    });

    it('should manage methods through CRUD operations', () => {
      // Switch to Data Management tab
      cy.get('[data-cy="tab-data-management"]').click();
      
      // Test method creation
      cy.get('[data-cy="add-method-button"]').click();
      cy.get('[data-cy="method-dialog"]').should('be.visible');
      
      // Fill method form
      cy.get('[data-cy="method-name-input"]').type('Test GC Method - Hydrocarbons');
      cy.get('[data-cy="method-type-select"]').click();
      cy.get('[data-value="general_gc"]').click();
      cy.get('[data-cy="method-description-input"]').type('Test method for E2E testing');
      
      // Expand parameters section
      cy.get('[data-cy="method-parameters-accordion"]').click();
      
      // Modify some parameters
      cy.get('[data-cy="parameter-column-type"]').clear().type('DB-1');
      cy.get('[data-cy="parameter-column-length"]').clear().type('60');
      
      // Save method
      cy.get('[data-cy="method-save-button"]').click();
      cy.get('[data-cy="method-dialog"]').should('not.exist');
      
      // Verify method appears in table
      cy.get('[data-cy="methods-table"]').should('contain', 'Test GC Method');
    });

    it('should manage instruments through CRUD operations', () => {
      // Switch to Data Management tab
      cy.get('[data-cy="tab-data-management"]').click();
      
      // Test instrument creation
      cy.get('[data-cy="add-instrument-button"]').click();
      cy.get('[data-cy="instrument-dialog"]').should('be.visible');
      
      // Fill instrument form
      cy.get('[data-cy="instrument-name-input"]').type('E2E Test GC');
      cy.get('[data-cy="instrument-model-input"]').type('8860 GC');
      cy.get('[data-cy="instrument-serial-input"]').type('E2E001');
      cy.get('[data-cy="instrument-location-input"]').type('E2E Test Lab');
      cy.get('[data-cy="instrument-age-input"]').clear().type('1.5');
      
      // Save instrument
      cy.get('[data-cy="instrument-save-button"]').click();
      cy.get('[data-cy="instrument-dialog"]').should('not.exist');
      
      // Verify instrument appears in table
      cy.get('[data-cy="instruments-table"]').should('contain', 'E2E Test GC');
    });
  });

  describe('Setup and Quick-Run Workflow', () => {
    it('should complete full setup and simulation workflow', () => {
      // Ensure we're on the Setup tab
      cy.get('[data-cy="tab-setup"]').click();
      
      // Select instrument
      cy.get('[data-cy="instrument-select"]').click();
      cy.get('[data-cy="instrument-option"]').first().click();
      
      // Select method
      cy.get('[data-cy="method-select"]').click();
      cy.get('[data-cy="method-option"]').first().click();
      
      // Enter sample name
      cy.get('[data-cy="sample-name-input"]').clear().type('E2E Test Sample');
      
      // Select compounds
      cy.get('[data-cy="compounds-autocomplete"]').click();
      cy.get('[data-cy="compound-option"]').first().click();
      cy.get('[data-cy="compound-option"]').eq(1).click();
      
      // Click outside to close dropdown
      cy.get('body').click();
      
      // Verify selection summary
      cy.get('[data-cy="config-summary"]').should('be.visible');
      cy.get('[data-cy="compound-count-chip"]').should('contain', '2 compounds');
      
      // Run simulation
      cy.get('[data-cy="run-simulation-button"]').should('not.be.disabled');
      cy.get('[data-cy="run-simulation-button"]').click();
      
      // Wait for simulation to complete and switch to results
      cy.get('[data-cy="run-simulation-button"]', { timeout: 10000 }).should('not.have.class', 'Mui-disabled');
      
      // Should automatically switch to Results tab
      cy.get('[data-cy="tab-results"]').should('have.class', 'Mui-selected');
      
      // Verify results are displayed
      cy.get('[data-cy="chromatogram-viewer"]').should('be.visible');
      cy.get('[data-cy="peak-table"]').should('be.visible');
      
      // Verify chromatogram has data
      cy.get('[data-cy="chromatogram-plot"]').should('be.visible');
      
      // Verify peak table has peaks
      cy.get('[data-cy="peak-table-body"]').should('not.be.empty');
    });

    it('should save and load runs', () => {
      // First, create a run (same as previous test)
      cy.get('[data-cy="tab-setup"]').click();
      cy.get('[data-cy="instrument-select"]').click();
      cy.get('[data-cy="instrument-option"]').first().click();
      cy.get('[data-cy="method-select"]').click();
      cy.get('[data-cy="method-option"]').first().click();
      cy.get('[data-cy="sample-name-input"]').clear().type('Save Test Sample');
      cy.get('[data-cy="compounds-autocomplete"]').click();
      cy.get('[data-cy="compound-option"]').first().click();
      cy.get('body').click();
      cy.get('[data-cy="run-simulation-button"]').click();
      
      // Wait for results
      cy.get('[data-cy="chromatogram-viewer"]', { timeout: 10000 }).should('be.visible');
      
      // Save the run
      cy.get('[data-cy="save-run-button"]').click();
      
      // Verify save success (could be a toast notification)
      cy.get('[data-cy="save-success-notification"]', { timeout: 5000 }).should('be.visible');
      
      // Go to Data Management tab to see saved runs
      cy.get('[data-cy="tab-data-management"]').click();
      cy.get('[data-cy="saved-runs-table"]').should('contain', 'Save Test Sample');
      
      // Load the run
      cy.get('[data-cy="saved-runs-table"]')
        .contains('Save Test Sample')
        .parent()
        .within(() => {
          cy.get('[data-cy="load-run-button"]').click();
        });
      
      // Should switch back to Results tab
      cy.get('[data-cy="tab-results"]').should('have.class', 'Mui-selected');
      
      // Verify the loaded run data
      cy.get('[data-cy="sample-name-display"]').should('contain', 'Save Test Sample');
      cy.get('[data-cy="chromatogram-viewer"]').should('be.visible');
    });
  });

  describe('Peak Editing and Analysis', () => {
    beforeEach(() => {
      // Create a simulation with peaks for editing
      cy.get('[data-cy="tab-setup"]').click();
      cy.get('[data-cy="instrument-select"]').click();
      cy.get('[data-cy="instrument-option"]').first().click();
      cy.get('[data-cy="method-select"]').click();
      cy.get('[data-cy="method-option"]').first().click();
      cy.get('[data-cy="sample-name-input"]').clear().type('Peak Edit Test');
      cy.get('[data-cy="compounds-autocomplete"]').click();
      cy.get('[data-cy="compound-option"]').first().click();
      cy.get('[data-cy="compound-option"]').eq(1).click();
      cy.get('body').click();
      cy.get('[data-cy="run-simulation-button"]').click();
      cy.get('[data-cy="chromatogram-viewer"]', { timeout: 10000 }).should('be.visible');
    });

    it('should allow peak editing in the peak table', () => {
      // Go to Results tab
      cy.get('[data-cy="tab-results"]').click();
      
      // Verify peak table is visible and has peaks
      cy.get('[data-cy="peak-table"]').should('be.visible');
      cy.get('[data-cy="peak-table-row"]').should('have.length.greaterThan', 0);
      
      // Edit the first peak
      cy.get('[data-cy="peak-table-row"]').first().within(() => {
        // Click edit button or double-click cell
        cy.get('[data-cy="peak-edit-button"]').click();
      });
      
      // Edit peak name
      cy.get('[data-cy="peak-name-input"]').clear().type('Edited Peak 1');
      
      // Save changes
      cy.get('[data-cy="peak-save-button"]').click();
      
      // Verify changes are reflected
      cy.get('[data-cy="peak-table-row"]').first().should('contain', 'Edited Peak 1');
      
      // Verify chromatogram updates (peak label should change)
      cy.get('[data-cy="chromatogram-plot"]').should('contain', 'Edited Peak 1');
    });

    it('should update chromatogram when peaks are modified', () => {
      cy.get('[data-cy="tab-results"]').click();
      
      // Count initial peaks
      cy.get('[data-cy="peak-table-row"]').then($rows => {
        const initialPeakCount = $rows.length;
        
        // Delete a peak
        cy.get('[data-cy="peak-table-row"]').first().within(() => {
          cy.get('[data-cy="peak-delete-button"]').click();
        });
        
        // Confirm deletion
        cy.get('[data-cy="confirm-delete-button"]').click();
        
        // Verify peak count decreased
        cy.get('[data-cy="peak-table-row"]').should('have.length', initialPeakCount - 1);
        
        // Verify chromatogram updated
        cy.get('[data-cy="chromatogram-plot"]').should('be.visible');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing selections gracefully', () => {
      cy.get('[data-cy="tab-setup"]').click();
      
      // Try to run without selections
      cy.get('[data-cy="run-simulation-button"]').should('be.disabled');
      
      // Select only instrument
      cy.get('[data-cy="instrument-select"]').click();
      cy.get('[data-cy="instrument-option"]').first().click();
      cy.get('[data-cy="run-simulation-button"]').should('be.disabled');
      
      // Select method - should enable button
      cy.get('[data-cy="method-select"]').click();
      cy.get('[data-cy="method-option"]').first().click();
      cy.get('[data-cy="run-simulation-button"]').should('not.be.disabled');
    });

    it('should handle API errors gracefully', () => {
      // Intercept API calls to simulate errors
      cy.intercept('POST', '/api/v1/chromatography/quick-run', {
        statusCode: 500,
        body: { message: 'Simulation failed' }
      }).as('simulationError');
      
      cy.get('[data-cy="tab-setup"]').click();
      cy.get('[data-cy="instrument-select"]').click();
      cy.get('[data-cy="instrument-option"]').first().click();
      cy.get('[data-cy="method-select"]').click();
      cy.get('[data-cy="method-option"]').first().click();
      cy.get('[data-cy="run-simulation-button"]').click();
      
      cy.wait('@simulationError');
      
      // Should show error message
      cy.get('[data-cy="error-notification"]').should('be.visible');
      cy.get('[data-cy="error-notification"]').should('contain', 'Simulation failed');
    });

    it('should validate form inputs', () => {
      cy.get('[data-cy="tab-data-management"]').click();
      
      // Test compound form validation
      cy.get('[data-cy="add-compound-button"]').click();
      cy.get('[data-cy="compound-save-button"]').click();
      
      // Should show validation error for empty name
      cy.get('[data-cy="compound-name-input"]').should('have.class', 'Mui-error');
      
      // Test with invalid retention time
      cy.get('[data-cy="compound-name-input"]').type('Invalid Compound');
      cy.get('[data-cy="compound-retention-time-input"]').clear().type('-1');
      cy.get('[data-cy="compound-save-button"]').click();
      
      // Should show validation error
      cy.get('[data-cy="compound-retention-time-input"]').should('have.class', 'Mui-error');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should load components within acceptable time', () => {
      const startTime = Date.now();
      
      cy.get('[data-cy="gc-sandbox-container"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
    });

    it('should handle large datasets efficiently', () => {
      // Load compounds tab and verify it can handle many items
      cy.get('[data-cy="tab-data-management"]').click();
      
      // If compounds table has many items, it should still be responsive
      cy.get('[data-cy="compounds-table"]').should('be.visible');
      cy.get('[data-cy="compounds-table"] tbody tr').should('have.length.greaterThan', 0);
      
      // Scrolling should be smooth
      cy.get('[data-cy="compounds-table-container"]').scrollTo('bottom');
      cy.get('[data-cy="compounds-table-container"]').scrollTo('top');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport(375, 667);
    });

    it('should be responsive on mobile devices', () => {
      // Verify main container is visible and responsive
      cy.get('[data-cy="gc-sandbox-container"]').should('be.visible');
      
      // Verify tabs are accessible
      cy.get('[data-cy="tab-setup"]').should('be.visible');
      cy.get('[data-cy="tab-data-management"]').should('be.visible');
      cy.get('[data-cy="tab-results"]').should('be.visible');
      
      // Test setup workflow on mobile
      cy.get('[data-cy="tab-setup"]').click();
      cy.get('[data-cy="instrument-select"]').should('be.visible');
      cy.get('[data-cy="method-select"]').should('be.visible');
      cy.get('[data-cy="run-simulation-button"]').should('be.visible');
    });

    it('should handle mobile form interactions', () => {
      cy.get('[data-cy="tab-data-management"]').click();
      cy.get('[data-cy="add-compound-button"]').click();
      
      // Form should be properly sized for mobile
      cy.get('[data-cy="compound-dialog"]').should('be.visible');
      cy.get('[data-cy="compound-name-input"]').should('be.visible');
      
      // Should be able to fill form on mobile
      cy.get('[data-cy="compound-name-input"]').type('Mobile Test Compound');
      cy.get('[data-cy="compound-retention-time-input"]').clear().type('3.5');
    });
  });
});

// Helper commands for common operations
Cypress.Commands.add('createTestCompound', (name: string, rt: number) => {
  cy.get('[data-cy="tab-data-management"]').click();
  cy.get('[data-cy="add-compound-button"]').click();
  cy.get('[data-cy="compound-name-input"]').type(name);
  cy.get('[data-cy="compound-retention-time-input"]').clear().type(rt.toString());
  cy.get('[data-cy="compound-save-button"]').click();
});

Cypress.Commands.add('runSimulation', (sampleName: string) => {
  cy.get('[data-cy="tab-setup"]').click();
  cy.get('[data-cy="instrument-select"]').click();
  cy.get('[data-cy="instrument-option"]').first().click();
  cy.get('[data-cy="method-select"]').click();
  cy.get('[data-cy="method-option"]').first().click();
  cy.get('[data-cy="sample-name-input"]').clear().type(sampleName);
  cy.get('[data-cy="run-simulation-button"]').click();
  cy.get('[data-cy="chromatogram-viewer"]', { timeout: 10000 }).should('be.visible');
});

declare global {
  namespace Cypress {
    interface Chainable {
      createTestCompound(name: string, rt: number): Chainable<void>;
      runSimulation(sampleName: string): Chainable<void>;
    }
  }
}
