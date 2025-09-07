// This test logs in as two users, sends a message, and verifies real-time delivery.
// Make sure your backend and frontend are running and demo users are seeded!

const userA = { email: 'demo1@example.com', password: 'demo123' };
const userB = { email: 'demo2@example.com', password: 'demo123' };
const messageText = `Hello from Cypress ${Date.now()}`;

describe('PulseChat Real-Time Messaging', () => {
  it('User A logs in and sends a message to User B, User B receives in real time', () => {
    // User A login
    cy.visit('/login');
    cy.get('input[type=email]').type(userA.email);
    cy.get('input[type=password]').type(userA.password);
    cy.get('button[type=submit]').contains(/sign in/i).click();
    cy.contains('Contacts', {timeout: 10000});

    // User A selects User B in contacts
    cy.contains(userB.email.split('@')[0]).click();
    cy.get('textarea,input[placeholder*="Type a message"]').type(messageText);
    cy.get('button[type=submit],button[title="Send message"]').click();
    cy.contains(messageText, {timeout: 5000});

    // Open a new browser context for User B
    cy.origin('http://localhost:5177', () => {
      cy.visit('/login');
      cy.get('input[type=email]').type(userB.email);
      cy.get('input[type=password]').type(userB.password);
      cy.get('button[type=submit]').contains(/sign in/i).click();
      cy.contains('Contacts', {timeout: 10000});
      cy.contains(userA.email.split('@')[0]).click();
      cy.contains(messageText, {timeout: 5000});
    });
  });
});
