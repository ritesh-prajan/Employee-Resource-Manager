import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time — reduces unnecessary refetches
      staleTime: 5 * 60 * 1000,
      // Retry failed requests once before surfacing error
      retry: 1,
    },
  },
})

// ─── Global custom form validation ───────────────────────────────────────────
// Suppress browser native tooltip bubbles and show clean red text below fields.
document.addEventListener('invalid', (e) => {
  const field = e.target;
  e.preventDefault(); // Kill the default browser tooltip

  // Mark field as red-bordered
  field.classList.add('field-invalid');

  // Remove any existing error message for this field
  const existingMsg = field.parentElement?.querySelector('.field-error-msg');
  if (existingMsg) existingMsg.remove();

  // Build the error message text
  let msg = field.validationMessage || 'This field is required.';
  // Make email-specific messages friendlier
  if (field.type === 'email' && field.validity.typeMismatch) {
    msg = 'Please enter a valid email address.';
  }
  if (field.validity.valueMissing) {
    msg = field.dataset.errorMsg || 'This field is required.';
  }

  const errorSpan = document.createElement('span');
  errorSpan.className = 'field-error-msg';
  errorSpan.textContent = msg;
  field.parentElement?.appendChild(errorSpan);

  // Clear error when the user starts correcting the field
  const clearError = () => {
    field.classList.remove('field-invalid');
    const msg = field.parentElement?.querySelector('.field-error-msg');
    if (msg) msg.remove();
    field.removeEventListener('input', clearError);
    field.removeEventListener('change', clearError);
  };
  field.addEventListener('input', clearError);
  field.addEventListener('change', clearError);
}, true); // capture phase so it fires before React's handlers
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <StrictMode>
        <App />
      </StrictMode>
      {/* Only loads in development builds */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </BrowserRouter>
)
