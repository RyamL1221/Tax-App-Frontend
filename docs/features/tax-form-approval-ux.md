# Tax Form Approval User Experience

## Overview

This document describes the user experience flow when a user approves a tax form in the Tax App. The pattern was first implemented for the 1099-DIV form and should be applied consistently to all tax forms.

## User Journey

### 1. Form Input
User fills out the tax form with required information (payer details, recipient details, amounts, etc.).

### 2. Preview Generation
After submitting the form:
- System generates a PDF document via the backend API
- User sees a preview of the generated PDF
- User can download, edit, or approve the form

### 3. Approval Flow
When user clicks "Approve":

1. **Download Initiated**: PDF automatically downloads to user's device
2. **Success Screen**: Displays confirmation with:
   - Green checkmark icon
   - "Form Approved Successfully!" message
   - "Your PDF is downloading automatically" notification
   - Countdown timer (5 seconds)
   - "Go to Dashboard Now" skip button
3. **Auto-Redirect**: After countdown, user is redirected to dashboard

## Visual Design

### Success Screen Layout

```
┌─────────────────────────────────────┐
│                                     │
│            ✓ (green)                │
│                                     │
│   Form Approved Successfully!       │
│   Your 1099-DIV form has been       │
│   finalized.                        │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ 📄 Your PDF is downloading  │   │
│   │    automatically            │   │
│   └─────────────────────────────┘   │
│                                     │
│   Redirecting to dashboard in...    │
│                                     │
│              5                      │
│           seconds                   │
│                                     │
│   [ Go to Dashboard Now ]           │
│                                     │
└─────────────────────────────────────┘
```

## Technical Implementation

### Key Components
- `Form1099DivPreview.tsx` - Reference implementation
- `useForm1099Div.ts` - Form workflow hook

### State Management
```typescript
const [showSuccess, setShowSuccess] = useState(false);
const [countdown, setCountdown] = useState(5);
```

### Countdown Logic
- Uses `useEffect` with `setTimeout`
- Decrements every second
- Navigates to dashboard when reaching 0
- Cleanup on unmount prevents memory leaks

## Error Handling

If download fails during approval:
- Error message displayed
- User stays in preview mode
- Can retry or use manual download button

## Accessibility

- `role="status"` for screen reader announcements
- `aria-live="polite"` for dynamic content updates
- `aria-atomic="true"` on countdown for complete value reading
- Keyboard-accessible skip button

## Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Countdown | 5 seconds | Gives user time to see confirmation |
| Redirect | /dashboard | Returns to form selection |
| Filename | {formType}-{jobId}.pdf | Unique per document |

## Future Considerations

- Consider adding sound/haptic feedback for mobile
- Could add option to disable auto-redirect in user preferences
- May want to show download progress for large files
