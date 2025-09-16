// System status utilities
export const checkSystemStatus = async () => {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    // Determine service status from health endpoint and error messages
    return {
      stripe: data.environment?.hasStripe || false,
      openai: data.environment?.hasOpenAI || false, 
      sendgrid: data.environment?.hasSendGrid || false,
      database: data.services?.database === 'healthy',
      server: data.status === 'healthy'
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