# Root Cause Analysis - Password Toggle Button

## Investigation Results

### Code Inspection Findings

**Task 1.1 - Current State:**
✅ All buttons have `type="button"`
✅ All handlers have `e.preventDefault()` and `e.stopPropagation()`
✅ Event handlers are properly defined

**Task 1.4 - SVG Element Analysis:**
❌ **PROBLEM FOUND**: SVG elements inside buttons do NOT have `pointer-events: none`

### Root Cause Category: **Category A - Button Not Receiving Clicks (CSS/DOM Issue)**

## The Problem

When users click on the eye icon, they're actually clicking on the SVG element, not the button. By default, SVG elements capture pointer events. The click event hits the SVG and stops there, never reaching the button's onClick handler.

### Evidence:
1. The SVG elements in PasswordInput.tsx have no `pointer-events` style
2. The SVG elements in LoginForm.tsx have no `pointer-events` style  
3. The path elements inside the SVGs also capture clicks
4. This is a well-known issue with clickable buttons containing SVG icons

## The Solution

Add `style={{ pointerEvents: 'none' }}` to all SVG elements inside toggle buttons. This makes the SVG "transparent" to pointer events, allowing clicks to pass through to the button.

### Files to Fix:
1. `src/components/ui/PasswordInput.tsx` - Both SVG icons
2. `src/components/LoginForm.tsx` - Both SVG icons

## Why Previous Fixes Didn't Work

The previous fixes focused on:
- Event propagation (`e.preventDefault()`, `e.stopPropagation()`)
- Button type (`type="button"`)
- Event handler binding

But none of these matter if the click never reaches the button in the first place! The SVG was intercepting clicks before they could trigger the button's onClick handler.

## Next Steps

Implement Fix 3.1 (Category A fix):
- Add `pointer-events: none` to all SVG elements
- Add `pointer-events: none` to all path elements inside SVGs
- Test that clicks now reach the button
