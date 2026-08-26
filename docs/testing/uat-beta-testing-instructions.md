# UAT Testing Instructions — Tax App Beta

## Overview

This document provides step-by-step testing instructions for beta testers. Test each section in order, as later sections depend on earlier ones (e.g., you need an account to test the dashboard).

**Test Environment URL:** https://the-tax-app.vercel.app

---

## 1. Registration

**Page:** /register

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Navigate to the app URL | Home page loads with navbar showing Home, Login, and Register links |
| 1.2 | Click "Register" in the navbar | Registration form appears with Full Name, Email, Password, and Confirm Password fields |
| 1.3 | Leave all fields empty and click "Create Account" | Validation errors appear for all required fields |
| 1.4 | Enter a single character in Full Name, then click away | Error: name must be at least 2 characters |
| 1.5 | Enter an invalid email (e.g., "notanemail") and click away | Error: invalid email format |
| 1.6 | Type a short password (e.g., "ab") | Password strength indicator shows weak; password requirements list shows unmet criteria |
| 1.7 | Type a strong password (8+ chars, mixed case, numbers) | Password strength indicator updates in real-time to show strong |
| 1.8 | Enter a different value in Confirm Password | Error: passwords do not match |
| 1.9 | Click the eye icon next to Password | Password text becomes visible; clicking again hides it |
| 1.10 | Fill all fields correctly and submit | Button shows "Creating account...", then you are redirected to the dashboard |

**Note for testers:** Remember your email and password for subsequent tests.

---

## 2. Logout

**Page:** /dashboard (after registration/login)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | On the dashboard, locate the "Log Out" button | Button is in the top-right area of the dashboard card |
| 2.2 | Click "Log Out" | You are immediately redirected to /login; no loading spinner or delay |
| 2.3 | Use browser back button | You should NOT see the dashboard; you are redirected to login again |
| 2.4 | Check the navbar | Shows Login and Register links (not Dashboard or Log Out) |

---

## 3. Login

**Page:** /login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Navigate to /login | Login form appears with Email and Password fields, and a "Forgot password?" link |
| 3.2 | Submit with empty fields | Validation errors appear for both fields |
| 3.3 | Enter wrong credentials and submit | Error message: "Invalid email or password" (red alert box) |
| 3.4 | Start typing in either field after an error | The error message clears |
| 3.5 | Click the eye icon next to Password | Password becomes visible |
| 3.6 | Enter correct credentials and submit | Blue "Authenticating..." spinner appears, then green "Login successful!" briefly, then redirect to dashboard |
| 3.7 | Verify the navbar updates | Shows Home, Dashboard, and Log Out links (no Login/Register) |

### Rate Limiting Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.8 | Submit wrong credentials rapidly 5+ times | Rate limit message appears with countdown timer; submit button is disabled |
| 3.9 | Wait for the timer to expire | Button becomes enabled again |

---

## 4. Forgot Password / Reset Password

**Page:** /forgot-password

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | From the login page, click "Forgot password?" | Navigates to forgot password page with a single email field |
| 4.2 | Submit with empty email | Validation error appears |
| 4.3 | Enter your registered email and submit | Button shows "Sending...", then success screen appears: green checkmark + "Check Your Email" message |
| 4.4 | Check your email for the reset link | Email contains a link to /reset-password?token=... |
| 4.5 | Click the reset link | Reset password form loads with New Password and Confirm Password fields |
| 4.6 | Enter mismatched passwords | Error: passwords do not match |
| 4.7 | Enter a valid matching password and submit | Success screen: "Password Reset Successful" with auto-redirect countdown to login |
| 4.8 | Verify you can log in with the new password | Login succeeds |

---

## 5. Dashboard

**Page:** /dashboard (must be logged in)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Observe the page layout | Card with title "Tax Form Dashboard", description text, Log Out button in top-right, and form selector |
| 5.2 | Check the dropdown label | "Select Tax Form" with placeholder "Select a tax form..." |
| 5.3 | Open the dropdown | Shows "1099-DIV - Dividends and Distributions" |
| 5.4 | Without selecting a form, check the "Fill Out Form" button | Button is disabled |
| 5.5 | Select "1099-DIV" from the dropdown | Button becomes enabled |
| 5.6 | Click "Fill Out Form" | Navigates to /forms/1099-div |

---

## 6. 1099-DIV Form Page — Method Selection

**Page:** /forms/1099-div

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Observe the page | Page header "1099-DIV Form", Blank Form Reference section, and two method cards (CSV Bulk Upload, Fill Out Form) |
| 6.2 | Check the Blank Form Reference section | Shows "Preview Blank 1099-DIV Form" and "Download Blank 1099-DIV Form" links |
| 6.3 | Click "Preview Blank 1099-DIV Form" | PDF previews inline on the page |
| 6.4 | Click "Download Blank 1099-DIV Form" | Browser downloads a PDF file |
| 6.5 | Click the "CSV Bulk Upload" card | Card view disappears; shows "CSV Bulk Upload" heading with "Change method" link above |
| 6.6 | Click "← Change method" | Returns to the two-card selection view |
| 6.7 | Click the "Fill Out Form" card | Shows "Fill Out Form" heading with the manual entry form below |
| 6.8 | Use keyboard (Tab to card, press Enter) | Same selection behavior as clicking |

---

## 7. 1099-DIV Manual Form Entry

**Page:** /forms/1099-div (after selecting "Fill Out Form")

### 7A. Form Input

| Step | Action | Expected Result |
|------|--------|-----------------|
| 7.1 | Observe the form sections | Organized sections: Calendar Year, Payer Info, Recipient Info, Dividend amounts, etc. |
| 7.2 | Submit the form with all fields empty | Validation errors appear on required fields (Calendar Year, Payer Name, Payer TIN, Recipient Name, Recipient TIN, Total Ordinary Dividends) |
| 7.3 | Enter an invalid Calendar Year (e.g., "24") | Error: "Calendar year must be a 4-digit year (e.g., 2024)" |
| 7.4 | Enter invalid Payer TIN (e.g., "123") | Error: "Payer TIN must be in format XX-XXXXXXX" |
| 7.5 | Enter invalid Recipient TIN (e.g., "456") | Error: "Recipient TIN must be in format XXX-XX-XXXX" |
| 7.6 | Enter invalid currency (e.g., "abc") | Error: "Must be a valid amount with up to 2 decimal places" |
| 7.7 | Click "Fill Sample Data" button | All fields populate with example data |
| 7.8 | Submit the form with valid data | Button shows loading state, then form transitions to preview |

### 7B. Preview & Approve

| Step | Action | Expected Result |
|------|--------|-----------------|
| 7.9 | Observe the preview | Shows "Preview Generated Document" header, document info (Job ID, Status badge, Document Type), PDF preview iframe, Edit/Approve buttons |
| 7.10 | Check the Status badge | Shows "Completed" (green) when PDF generation is done |
| 7.11 | Verify the PDF preview loads | PDF displays inside the page (may take a moment to load) |
| 7.12 | Click "Edit Form" | Returns to the input form with all data preserved |
| 7.13 | Make a change and re-submit | Preview updates with the new data |
| 7.14 | Click "Approve" | Button shows spinner + "Downloading...", then PDF downloads to your device |
| 7.15 | After approve succeeds | Full-screen success: green checkmark, "Form Approved Successfully!", countdown timer, then redirects to dashboard |

---

## 8. CSV Bulk Upload

**Page:** /forms/1099-div (after selecting "CSV Bulk Upload")

### 8A. Template Download

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8.1 | Locate the template links section | Shows Preview/Download for Simple Template and Full Template |
| 8.2 | Click "Preview Simple Template" | CSV content previews inline on the page |
| 8.3 | Click "Download Simple Template" | Browser downloads a .csv file |
| 8.4 | Click "Download Full Template" | Browser downloads a .csv file with more columns |
| 8.5 | Open the downloaded CSV in a spreadsheet | Column headers match the expected 1099-DIV fields |

### 8B. File Upload

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8.6 | Without selecting a file, check the Upload button | "Upload CSV" button is disabled |
| 8.7 | Click the file input and select a non-CSV file | File input only shows .csv files (browser filter) |
| 8.8 | Select a valid CSV file | Filename appears below the input; Upload button becomes enabled |
| 8.9 | Click "Upload CSV" | Button shows "Uploading..." and becomes disabled during upload |

### 8C. Upload Results

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8.10 | After successful upload | Results view appears with summary: total rows, succeeded, failed |
| 8.11 | If rows failed | Error table shows row numbers and error messages |
| 8.12 | If rows succeeded | Success table shows row numbers, recipient names, and download buttons |
| 8.13 | Click a download button for a successful row | PDF for that specific form downloads |
| 8.14 | Click "Upload Another File" | Resets back to the file selection state |

### 8D. Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 8.15 | Upload a CSV with invalid data | Results show failed rows with descriptive error messages |
| 8.16 | Upload while disconnected from internet | Error message appears: "Unable to connect. Please check your internet connection." |
| 8.17 | If a retry-able error occurs | "Retry" button appears below the error message |

---

## 9. Session Expiry & Form Data Preservation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 9.1 | Start filling out the 1099-DIV manual form (enter some data but don't submit) | Form data is entered |
| 9.2 | Open browser DevTools → Application → Local Storage → delete "jwt_token" | Simulates session expiry |
| 9.3 | Try to submit the form | Redirected to /login with returnUrl parameter |
| 9.4 | Log back in | Redirected back to the form page |
| 9.5 | Check if form data is preserved | Green notification appears indicating data was restored; previously-entered values are populated |

---

## 10. Navigation & Responsive Design

| Step | Action | Expected Result |
|------|--------|-----------------|
| 10.1 | Resize browser to mobile width (< 640px) | Layout adapts — cards stack vertically, text/buttons resize appropriately |
| 10.2 | Test on a phone or tablet device | All interactions work with touch; no elements overflow the screen |
| 10.3 | Navigate between pages using navbar | All links work correctly; auth state is reflected accurately |
| 10.4 | Open the app in two tabs, log out in one | The other tab should redirect to login on next interaction (token cleared) |

---

## 11. Accessibility Checks

| Step | Action | Expected Result |
|------|--------|-----------------|
| 11.1 | Navigate the entire app using only keyboard (Tab, Enter, Space) | All interactive elements are reachable and activatable |
| 11.2 | Use a screen reader on the method selection cards | Cards announce their label and pressed state |
| 11.3 | Submit a form with errors | Focus moves to the error area; screen reader announces the error |
| 11.4 | Check color contrast on all text | Text is readable against backgrounds (no light-gray-on-white issues) |

---

## Bug Reporting Template

When reporting issues, please include:

```
**Summary:** (one-line description)
**Steps to Reproduce:**
1.
2.
3.
**Expected Result:**
**Actual Result:**
**Browser/Device:** (e.g., Chrome 120 / macOS, Safari / iPhone 15)
**Screenshot:** (attach if applicable)
**Console Errors:** (open DevTools → Console, copy any red error messages)
```

---

## Known Limitations (Beta)

- Only the 1099-DIV form is available in this beta release.
- PDF generation requires backend connectivity — if the API is down, form submission and approve will fail.
- CSV uploads with more than 10 rows are processed asynchronously; results may not appear immediately.
- Password reset emails may take 1-2 minutes to arrive.
