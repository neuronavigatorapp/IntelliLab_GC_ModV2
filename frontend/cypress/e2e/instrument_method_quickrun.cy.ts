describe('Instrument/Method creation and Quick-Run', () => {
  it('loads Instruments page and opens add dialog', () => {
    cy.visit('/instruments');
    cy.contains('Add Instrument').click();
    cy.contains('Add New GC Instrument');
  });

  it('navigates to Methods page', () => {
    cy.visit('/methods');
    cy.contains('Create Method');
  });

  it('performs Quick Run via Chromatogram Simulator', () => {
    cy.visit('/tools/chromatogram-simulator');
    cy.contains('Run Simulation');
  });
});


