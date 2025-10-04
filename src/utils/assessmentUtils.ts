
// Helper function to safely convert Json to Record<string, any>
export const safeJsonToRecord = (json: any): Record<string, any> => {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return json as Record<string, any>;
  }
  return {};
};
