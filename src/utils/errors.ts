/**
 * Formats API errors into clean, friendly, human-readable messages.
 */
export function formatErrorMessage(error: any, fallbackMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallbackMessage;

  // Handle network / timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'The server took too long to respond. Please check your internet connection and try again.';
  }
  if (error.message === 'Network Error' || !error.response) {
    return 'Unable to connect to the server. Please check your internet connection or verify the server is running.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Handle HTTP status code specifics
  if (status === 401) {
    if (data?.detail?.toLowerCase().includes('no active account') || data?.non_field_errors) {
      return 'Incorrect email or password. Please verify your credentials.';
    }
    return data?.detail || 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return data?.detail || 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return data?.detail || 'The requested resource was not found.';
  }

  if (status === 500) {
    return 'A server error occurred. Our team has been notified. Please try again shortly.';
  }

  // Handle DRF validation errors (object or string)
  if (typeof data === 'string') {
    return data;
  }

  if (data && typeof data === 'object') {
    // Check common DRF error fields
    if (data.detail && typeof data.detail === 'string') {
      return data.detail;
    }

    if (data.error && typeof data.error === 'string') {
      return data.error;
    }

    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      const msg = data.non_field_errors[0];
      if (typeof msg === 'string') {
        if (msg.includes('No active account found')) {
          return 'No account was found with these credentials. Please check your email and password.';
        }
        return msg;
      }
    }

    // Friendly translations for common field errors
    const fieldEntries = Object.entries(data);
    if (fieldEntries.length > 0) {
      const [field, rawVal] = fieldEntries[0];
      const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      const valStr = typeof val === 'string' ? val : JSON.stringify(val);

      const fieldLabels: Record<string, string> = {
        email: 'Email address',
        password: 'Password',
        phone: 'Phone number',
        first_name: 'First name',
        last_name: 'Last name',
        event_key: 'Event key',
        trigger: 'Trigger',
        channel: 'Channel',
        name: 'Name',
        subject: 'Subject',
        title: 'Title',
        body: 'Message body',
      };

      const label = fieldLabels[field] || field.replace(/_/g, ' ');

      // Context-aware friendly messages
      if (field === 'email' && valStr.toLowerCase().includes('already exists')) {
        return 'An account with this email address already exists. Please sign in instead.';
      }
      if (field === 'event_key' && valStr.toLowerCase().includes('already exists')) {
        return 'A trigger with this event key already exists. Please choose a different event key.';
      }
      if (valStr.toLowerCase().includes('already exists')) {
        return `A record with this ${label.toLowerCase()} already exists.`;
      }
      if (valStr.toLowerCase().includes('this field is required') || valStr.toLowerCase().includes('may not be blank')) {
        return `Please provide a valid ${label.toLowerCase()}.`;
      }

      return `${label}: ${valStr}`;
    }
  }

  return error.message || fallbackMessage;
}
