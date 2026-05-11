export function useCompany() {
  // In a real app, this would fetch from a global state/context or API
  return {
    companyName: 'Sharma Traders Pvt Ltd',
    gstin: '27AADCS1234F1Z9',
    stateCode: '27', // Maharashtra
    address: '123 Business Avenue, Andheri East, Mumbai, Maharashtra 400069',
  };
}
