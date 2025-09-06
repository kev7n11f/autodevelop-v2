// System status utilities
export const checkSystemStatus = async () => {
  try {
    const response = await fetch('/health');
    const data = await response.json();
    
    // Determine service status from health endpoint and error messages
    return {
      stripe: data.services?.stripe || false, // Will be false until configured
      openai: data.services?.openai || false, // Will be false until configured  
      sendgrid: data.services?.sendgrid || false, // Will be false until configured
      database: data.services?.database === 'healthy',
      server: data.services?.server === 'healthy'
    };
  } catch (error) {
    console.error('Failed to check system status:', error);
    return {
      stripe: false,
      openai: false,
      sendgrid: false,
      database: false,
      server: false
    };
  }
};

export const getServiceStatusIcon = (isAvailable) => {
  return isAvailable ? '✅' : '⚠️';
};

export const getServiceStatusText = (isAvailable) => {
  return isAvailable ? 'Available' : 'Configuring...';
};