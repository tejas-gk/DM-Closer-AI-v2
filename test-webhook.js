// Quick test to check webhook endpoint
const url = 'https://dm-closer-ai-hellocrossman.replit.app/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=dmcloser_webhook_verify_2025&hub.challenge=test123';

fetch(url)
  .then(response => {
    console.log('Status:', response.status);
    return response.text();
  })
  .then(data => {
    console.log('Response:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });