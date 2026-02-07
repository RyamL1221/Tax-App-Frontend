# Manual Testing Checklist: 1099-DIV Form Submission

This document provides a comprehensive manual testing checklist for the 1099-DIV form submission feature. Use this checklist to verify that all functionality works correctly across different devices, browsers, and scenarios.

## Test Environment Setup

Before beginning manual testing, ensure:
- [ ] Backend API is running and accessible
- [ ] Frontend development server is running (`npm run dev`)
- [ ] You have valid test credentials for authentication
- [ ] Browser developer tools are open for debugging

## 1. Responsive Design Testing

### Mobile Testing (< 768px)

**Device/Viewport:** iPhone 12 (390x844) or similar

- [ ] Form renders in single-column layout
- [ ] All form sections are visible and properly spaced
- [ ] Input fields are appropriately sized for touch (minimum 44x44px)
- [ ] Text is readable without zooming
- [ ] Submit button is full-width on mobile
- [ ] Error messages display properly without overflow
- [ ] Preview section is readable and scrollable
- [ ] Action buttons (Edit/Approve) are touch-friendly
- [ ] Download link is easily tappable
- [ ] Success message displays correctly
- [ ] No horizontal scrolling required

**Test Steps:**
1. Open browser and resize to 390px width
2. Navigate to `/forms/1099-div`
3. Verify all items above
4. Complete a full form submission workflow
5. Test landscape orientation as well

### Tablet Testing (768px - 1024px)

**Device/Viewport:** iPad (768x1024) or similar

- [ ] Form uses appropriate multi-column layout where suitable
- [ ] Form sections are well-organized
- [ ] Touch targets are appropriately sized
- [ ] Preview displays with good use of space
- [ ] Action buttons are properly sized and positioned

**Test Steps:**
1. Resize browser to 768px width
2. Navigate to `/forms/1099-div`
3. Verify all items above
4. Complete a full form submission workflow

### Desktop Testing (> 1024px)

**Device/Viewport:** Desktop (1920x1080) or similar

- [ ] Form uses multi-column layout for efficiency
- [ ] Form sections are well-organized and easy to scan
- [ ] Input fields are appropriately sized (not too wide)
- [ ] Preview displays with good use of space
- [ ] Action buttons are properly sized and positioned
- [ ] No excessive whitespace or cramped layouts

**Test Steps:**
1. Open browser in full-screen desktop mode
2. Navigate to `/forms/1099-div`
3. Verify all items above
4. Complete a full form submission workflow

### Viewport Change Testing

- [ ] Resize browser from mobile to desktop while form is filled
- [ ] Verify no data loss during resize
- [ ] Verify layout adapts smoothly
- [ ] Resize during preview mode
- [ ] Verify preview adapts correctly

## 2. Form Validation Testing

### Required Field Validation

- [ ] Submit empty form - verify all required field errors appear
- [ ] Fill only calendar year - verify other required fields show errors
- [ ] Fill all required fields - verify form submits successfully

**Required Fields:**
- Calendar Year
- Payer Name
- Payer TIN
- Recipient Name
- Recipient TIN
- Total Ordinary Dividends

### Field Format Validation

**Calendar Year:**
- [ ] Enter "24" - verify error: "must be a 4-digit year"
- [ ] Enter "abcd" - verify error appears
- [ ] Enter "2024" - verify no error
- [ ] Enter "2025" - verify no error

**Payer TIN (XX-XXXXXXX):**
- [ ] Enter "123456789" - verify error about format
- [ ] Enter "12-345678" - verify error (too many digits)
- [ ] Enter "1-2345678" - verify error (not enough digits in first part)
- [ ] Enter "12-3456789" - verify no error
- [ ] Enter "123456789" (without hyphen) - verify if accepted or error shown

**Recipient TIN (XXX-XX-XXXX):**
- [ ] Enter "123456789" - verify error about format
- [ ] Enter "12-34-5678" - verify error (wrong format)
- [ ] Enter "123-45-6789" - verify no error
- [ ] Enter "123456789" (without hyphens) - verify if accepted or error shown

**State Codes:**
- [ ] Enter "New York" in state field - verify error
- [ ] Enter "ny" (lowercase) - verify if accepted or error
- [ ] Enter "NY" - verify no error
- [ ] Enter "ZZ" (invalid state) - verify error

**Currency Fields:**
- [ ] Enter "abc" - verify error
- [ ] Enter "-100" - verify error (negative)
- [ ] Enter "1000.123" - verify error (too many decimals)
- [ ] Enter "1000" - verify no error
- [ ] Enter "1000.00" - verify no error
- [ ] Enter "1000.5" - verify no error

### Error Message Display

- [ ] Verify error messages appear adjacent to fields
- [ ] Verify error messages have red text and icon
- [ ] Verify error messages are announced to screen readers
- [ ] Verify error messages clear when field is corrected
- [ ] Verify multiple errors can be displayed simultaneously

## 3. API Integration Testing

### Successful Submission

- [ ] Fill all required fields with valid data
- [ ] Click "Generate Preview"
- [ ] Verify loading indicator appears
- [ ] Verify submit button is disabled during loading
- [ ] Verify form inputs are disabled during loading
- [ ] Verify preview appears with correct job ID
- [ ] Verify preview shows status as "COMPLETED"
- [ ] Verify preview shows document type as "1099-DIV"
- [ ] Verify download link is present and functional

**Test Data:**
```
Calendar Year: 2024
Payer Name: Test Corporation
Payer TIN: 12-3456789
Recipient Name: John Doe
Recipient TIN: 123-45-6789
Total Ordinary Dividends: 1000.00
```

### API Error Handling

**400 Validation Error:**
- [ ] Trigger a 400 error from backend (if possible)
- [ ] Verify error message is displayed in alert box
- [ ] Verify error message is user-friendly
- [ ] Verify no retry button appears
- [ ] Verify form remains in input mode

**500 Server Error:**
- [ ] Trigger a 500 error from backend (stop backend or use mock)
- [ ] Verify generic server error message appears
- [ ] Verify retry button is displayed
- [ ] Click retry button
- [ ] Verify request is retried with same data

**Network Error:**
- [ ] Disconnect from network or stop backend
- [ ] Submit form
- [ ] Verify network error message appears
- [ ] Verify retry button is displayed
- [ ] Reconnect network
- [ ] Click retry button
- [ ] Verify successful submission

**401 Authentication Error:**
- [ ] Clear authentication token (use browser dev tools)
- [ ] Submit form
- [ ] Verify "session expired" message appears
- [ ] Verify redirect to login page after brief delay
- [ ] Verify no retry button appears

## 4. Workflow Testing

### Complete Workflow: Input → Preview → Approve

1. [ ] Navigate to `/forms/1099-div`
2. [ ] Fill in all required fields
3. [ ] Add some optional fields (qualified dividends, federal tax withheld)
4. [ ] Click "Generate Preview"
5. [ ] Verify preview displays all information correctly
6. [ ] Click "Download PDF" link
7. [ ] Verify PDF downloads or opens in new tab
8. [ ] Click "Approve" button
9. [ ] Verify success message appears
10. [ ] Wait 2 seconds
11. [ ] Verify form resets to empty state
12. [ ] Verify all fields are cleared

### Edit Workflow: Input → Preview → Edit → Preview → Approve

1. [ ] Fill form with initial data
2. [ ] Submit and verify preview appears
3. [ ] Click "Edit Form" button
4. [ ] Verify form appears with all data preserved
5. [ ] Modify payer name
6. [ ] Modify total dividends amount
7. [ ] Click "Generate Preview" again
8. [ ] Verify new preview appears with updated data
9. [ ] Verify API was called with modified data (check network tab)
10. [ ] Click "Approve"
11. [ ] Verify success and form reset

### Multiple Edit Cycles

1. [ ] Fill and submit form
2. [ ] Click "Edit" from preview
3. [ ] Modify data
4. [ ] Submit again
5. [ ] Click "Edit" again
6. [ ] Modify data again
7. [ ] Submit third time
8. [ ] Verify all edits work correctly
9. [ ] Approve final version

### Data Persistence Testing

1. [ ] Fill form with comprehensive data (all optional fields)
2. [ ] Submit and go to preview
3. [ ] Click "Edit"
4. [ ] Verify ALL data is preserved:
   - [ ] Calendar year
   - [ ] Payer information (name, TIN, address, city, state, zip)
   - [ ] Recipient information (name, TIN, address, city, state, zip)
   - [ ] All dividend amounts
   - [ ] Tax withholding amounts
   - [ ] State tax information
   - [ ] Checkbox states (voided, corrected, etc.)
5. [ ] Make no changes
6. [ ] Submit again
7. [ ] Verify preview shows same data

## 5. Accessibility Testing

### Screen Reader Testing

**Tool:** NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)

- [ ] Navigate to form with screen reader active
- [ ] Verify page title is announced
- [ ] Tab through all form fields
- [ ] Verify each field label is announced
- [ ] Verify required fields are announced as required
- [ ] Verify helper text is announced
- [ ] Enter invalid data in a field
- [ ] Tab away from field
- [ ] Verify error message is announced
- [ ] Navigate to submit button
- [ ] Verify button label is announced
- [ ] Submit form with errors
- [ ] Verify error summary is announced
- [ ] Navigate to preview mode
- [ ] Verify preview content is accessible
- [ ] Verify action buttons are announced correctly

### Keyboard Navigation Testing

**Form Input Mode:**
- [ ] Tab to first field (calendar year)
- [ ] Verify focus indicator is visible
- [ ] Tab through all form fields in logical order
- [ ] Verify tab order follows visual layout
- [ ] Tab to checkboxes
- [ ] Press Space to toggle checkboxes
- [ ] Tab to submit button
- [ ] Press Enter to submit
- [ ] Verify form submits

**Preview Mode:**
- [ ] Tab to download link
- [ ] Verify focus indicator is visible
- [ ] Press Enter to activate link
- [ ] Tab to "Edit Form" button
- [ ] Press Enter to activate
- [ ] Verify return to form mode
- [ ] Submit again to return to preview
- [ ] Tab to "Approve" button
- [ ] Press Enter to activate
- [ ] Verify success message appears

**Error State:**
- [ ] Submit form with errors
- [ ] Tab through error messages
- [ ] Verify focus moves to first error field
- [ ] Verify error messages are keyboard accessible

### Focus Management

- [ ] Verify focus indicator is always visible
- [ ] Verify focus indicator has sufficient contrast
- [ ] Verify focus doesn't get trapped
- [ ] Verify focus moves logically through form
- [ ] Verify focus is managed correctly during mode transitions

### ARIA Attributes

**Use browser inspector to verify:**
- [ ] All form fields have proper labels (aria-label or label element)
- [ ] Required fields have aria-required="true"
- [ ] Invalid fields have aria-invalid="true"
- [ ] Error messages have role="alert"
- [ ] Error messages are associated with fields via aria-describedby
- [ ] Loading states have aria-live regions
- [ ] Status badges have proper role and aria-label
- [ ] Buttons have descriptive aria-labels

### Color Contrast

**Use browser accessibility tools or contrast checker:**
- [ ] Verify text has minimum 4.5:1 contrast ratio
- [ ] Verify large text has minimum 3:1 contrast ratio
- [ ] Verify error messages have sufficient contrast
- [ ] Verify focus indicators have sufficient contrast
- [ ] Verify disabled states are distinguishable

## 6. Browser Compatibility Testing

Test the complete workflow in each browser:

### Chrome/Edge (Chromium)
- [ ] Form renders correctly
- [ ] All validation works
- [ ] API integration works
- [ ] Preview displays correctly
- [ ] PDF download works
- [ ] No console errors

### Firefox
- [ ] Form renders correctly
- [ ] All validation works
- [ ] API integration works
- [ ] Preview displays correctly
- [ ] PDF download works
- [ ] No console errors

### Safari (Mac/iOS)
- [ ] Form renders correctly
- [ ] All validation works
- [ ] API integration works
- [ ] Preview displays correctly
- [ ] PDF download works
- [ ] No console errors
- [ ] Date inputs work correctly

## 7. Optional Fields Testing

### Payer Address Fields
- [ ] Fill payer street address
- [ ] Fill payer city
- [ ] Fill payer state
- [ ] Fill payer ZIP
- [ ] Fill payer country
- [ ] Fill payer telephone
- [ ] Submit and verify all fields in API call

### Recipient Address Fields
- [ ] Fill recipient street address
- [ ] Fill recipient city
- [ ] Fill recipient state
- [ ] Fill recipient ZIP
- [ ] Fill recipient country
- [ ] Submit and verify all fields in API call

### Dividend Fields
- [ ] Fill qualified dividends
- [ ] Fill total capital gain distributions
- [ ] Fill section 1202 gain
- [ ] Fill section 199A dividends
- [ ] Submit and verify all fields in API call

### Tax Withholding Fields
- [ ] Fill federal income tax withheld
- [ ] Fill foreign tax paid
- [ ] Fill foreign country
- [ ] Submit and verify all fields in API call

### State Tax Fields
- [ ] Fill state 1 information (state, ID, tax withheld)
- [ ] Fill state 2 information
- [ ] Submit and verify both states in API call

### Checkbox Fields
- [ ] Check "Voided" checkbox
- [ ] Verify checkbox state is preserved on edit
- [ ] Submit and verify in API call
- [ ] Check "Corrected" checkbox
- [ ] Verify checkbox state is preserved on edit
- [ ] Submit and verify in API call
- [ ] Check "Second TIN Notification"
- [ ] Check "FATCA Filing Requirement"
- [ ] Submit and verify all checkboxes in API call

## 8. Edge Cases and Boundary Testing

### Maximum Length Testing
- [ ] Enter 100 characters in payer name (should accept)
- [ ] Enter 101 characters in payer name (should reject or truncate)
- [ ] Enter very long street address
- [ ] Enter maximum valid currency amount (e.g., 999999999.99)

### Special Characters
- [ ] Enter special characters in name fields (O'Brien, José, etc.)
- [ ] Verify special characters are preserved
- [ ] Enter special characters in address fields
- [ ] Verify proper handling

### Copy/Paste Testing
- [ ] Copy TIN from external source and paste
- [ ] Verify formatting is handled correctly
- [ ] Copy currency amount and paste
- [ ] Verify decimal handling

### Browser Back/Forward
- [ ] Fill form partially
- [ ] Navigate away using browser back
- [ ] Return using browser forward
- [ ] Verify form state (may be cleared - document behavior)

## 9. Error Message Clarity

For each error scenario, verify messages are:
- [ ] Clear and specific about what's wrong
- [ ] Actionable (tell user how to fix)
- [ ] User-friendly (no technical jargon)
- [ ] Grammatically correct
- [ ] Properly capitalized and punctuated

**Example Error Messages to Verify:**
- "Calendar year must be a 4-digit year (e.g., 2024)"
- "Payer TIN must be in format XX-XXXXXXX"
- "Recipient TIN must be in format XXX-XX-XXXX"
- "Must be a valid amount with up to 2 decimal places"
- "State must be a 2-letter code"
- "Your session has expired. Please log in again."
- "Server error. Please try again later."
- "Unable to connect to the server. Please check your internet connection and try again."

## 10. Performance Testing

### Load Time
- [ ] Measure initial page load time (should be < 3 seconds)
- [ ] Verify no layout shift during load
- [ ] Verify form is interactive quickly

### API Response Time
- [ ] Submit form and measure time to preview
- [ ] Verify loading indicator appears immediately
- [ ] Verify reasonable timeout handling (if API is slow)

### Large Form Data
- [ ] Fill all optional fields
- [ ] Submit and verify performance is acceptable
- [ ] Verify no lag in UI

## Test Results Summary

### Date Tested: _______________
### Tester Name: _______________
### Environment: _______________

### Issues Found:

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1       |             |          |        |
| 2       |             |          |        |
| 3       |             |          |        |

### Overall Assessment:

- [ ] All critical functionality works correctly
- [ ] Form is accessible to users with disabilities
- [ ] Form works across all tested browsers
- [ ] Form is responsive on all device sizes
- [ ] Error handling is robust and user-friendly
- [ ] API integration works correctly
- [ ] Ready for production deployment

### Notes:

_Add any additional observations or recommendations here._

---

## Quick Smoke Test (5 minutes)

If time is limited, perform this quick smoke test:

1. [ ] Open form on desktop browser
2. [ ] Fill required fields only
3. [ ] Submit and verify preview appears
4. [ ] Click "Approve" and verify success
5. [ ] Resize to mobile width
6. [ ] Fill and submit again
7. [ ] Verify works on mobile
8. [ ] Test one error scenario (submit empty form)
9. [ ] Verify error messages appear
10. [ ] Test keyboard navigation (Tab through form)

If all items pass, the basic functionality is working.
