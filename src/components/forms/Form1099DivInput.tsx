/**
 * Form1099DivInput Component
 * 
 * A comprehensive form input component for 1099-DIV tax form data entry.
 * Integrates React Hook Form with Zod validation for robust form management.
 * 
 * Features:
 * - Organized form sections (Calendar Year, Payer Info, Recipient Info, etc.)
 * - Required field indicators (asterisks)
 * - Appropriate input types (text, checkbox, currency)
 * - Helper text for format-specific fields
 * - Validation error display adjacent to fields
 * - Loading state during submission
 * - API error display
 * - Full accessibility support (ARIA labels, keyboard navigation)
 * - Responsive design (mobile and desktop)
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.8, 2.9, 4.1, 4.2, 4.3
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  form1099DivSchema, 
  type Form1099DivData,
  getDefaultFormValues 
} from '@/lib/validation/form1099DivSchema';

export interface Form1099DivInputProps {
  /**
   * Callback fired when the form is successfully submitted with valid data
   */
  onSubmit: (data: Form1099DivData) => Promise<void>;
  
  /**
   * Default values to populate the form (used when editing)
   */
  defaultValues?: Partial<Form1099DivData>;
  
  /**
   * API error message to display at the top of the form
   */
  error: string | null;
  
  /**
   * Optional retry handler for network/server errors
   */
  onRetry?: () => Promise<void>;
  
  /**
   * Whether a retry is currently in progress
   */
  isRetrying?: boolean;
  
  /**
   * Additional CSS classes for the form container
   */
  className?: string;
}

/**
 * Form1099DivInput Component
 * 
 * Main form component for 1099-DIV data entry with comprehensive validation
 * and user-friendly error handling.
 */
export function Form1099DivInput({ 
  onSubmit, 
  defaultValues, 
  error,
  onRetry,
  isRetrying = false,
  className 
}: Form1099DivInputProps) {
  // Initialize React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form1099DivData>({
    resolver: zodResolver(form1099DivSchema),
    defaultValues: defaultValues || getDefaultFormValues(),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Handle form submission
  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });
  
  // Handle retry button click
  const handleRetryClick = async () => {
    if (onRetry) {
      await onRetry();
    }
  };

  return (
    <form
      onSubmit={onFormSubmit}
      className={cn('space-y-8', className)}
      noValidate
    >
      {/* API Error Display with Retry Button */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-md bg-red-50 border border-red-200"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              {onRetry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetryClick}
                  disabled={isRetrying}
                  loading={isRetrying}
                  loadingText="Retrying..."
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                  aria-label="Retry the failed request"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Year Section */}
      <FormSection title="Calendar Year">
        <FormField
          label="Tax Year"
          required
          error={errors.calendarYear?.message}
          helperText="4-digit year (e.g., 2024)"
        >
          <input
            {...register('calendarYear')}
            type="text"
            id="calendarYear"
            placeholder="2024"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!errors.calendarYear}
            aria-describedby={errors.calendarYear ? 'calendarYear-error' : 'calendarYear-helper'}
            className={getInputClassName(!!errors.calendarYear, isSubmitting)}
          />
        </FormField>
      </FormSection>

      {/* Payer Information Section */}
      <FormSection title="Payer Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Payer Name"
            required
            error={errors.payerName?.message}
            className="md:col-span-2"
          >
            <input
              {...register('payerName')}
              type="text"
              id="payerName"
              placeholder="Company Name"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.payerName}
              aria-describedby={errors.payerName ? 'payerName-error' : undefined}
              className={getInputClassName(!!errors.payerName, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Payer TIN"
            required
            error={errors.payerTIN?.message}
            helperText="Format: XX-XXXXXXX"
          >
            <input
              {...register('payerTIN')}
              type="text"
              id="payerTIN"
              placeholder="12-3456789"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.payerTIN}
              aria-describedby={errors.payerTIN ? 'payerTIN-error' : 'payerTIN-helper'}
              className={getInputClassName(!!errors.payerTIN, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Payer Telephone"
            error={errors.payerTelephoneNumber?.message}
          >
            <input
              {...register('payerTelephoneNumber')}
              type="tel"
              id="payerTelephoneNumber"
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
              aria-invalid={!!errors.payerTelephoneNumber}
              aria-describedby={errors.payerTelephoneNumber ? 'payerTelephoneNumber-error' : undefined}
              className={getInputClassName(!!errors.payerTelephoneNumber, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Street Address"
            error={errors.payerStreetAddress?.message}
            className="md:col-span-2"
          >
            <input
              {...register('payerStreetAddress')}
              type="text"
              id="payerStreetAddress"
              placeholder="123 Main Street"
              disabled={isSubmitting}
              aria-invalid={!!errors.payerStreetAddress}
              aria-describedby={errors.payerStreetAddress ? 'payerStreetAddress-error' : undefined}
              className={getInputClassName(!!errors.payerStreetAddress, isSubmitting)}
            />
          </FormField>

          <FormField
            label="City"
            error={errors.payerCity?.message}
          >
            <input
              {...register('payerCity')}
              type="text"
              id="payerCity"
              placeholder="New York"
              disabled={isSubmitting}
              aria-invalid={!!errors.payerCity}
              aria-describedby={errors.payerCity ? 'payerCity-error' : undefined}
              className={getInputClassName(!!errors.payerCity, isSubmitting)}
            />
          </FormField>

          <FormField
            label="State"
            error={errors.payerState?.message}
            helperText="2-letter code (e.g., NY)"
          >
            <input
              {...register('payerState')}
              type="text"
              id="payerState"
              placeholder="NY"
              maxLength={2}
              disabled={isSubmitting}
              aria-invalid={!!errors.payerState}
              aria-describedby={errors.payerState ? 'payerState-error' : 'payerState-helper'}
              className={getInputClassName(!!errors.payerState, isSubmitting)}
            />
          </FormField>

          <FormField
            label="ZIP Code"
            error={errors.payerZip?.message}
          >
            <input
              {...register('payerZip')}
              type="text"
              id="payerZip"
              placeholder="10005"
              disabled={isSubmitting}
              aria-invalid={!!errors.payerZip}
              aria-describedby={errors.payerZip ? 'payerZip-error' : undefined}
              className={getInputClassName(!!errors.payerZip, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Country"
            error={errors.payerCountry?.message}
          >
            <input
              {...register('payerCountry')}
              type="text"
              id="payerCountry"
              placeholder="USA"
              disabled={isSubmitting}
              aria-invalid={!!errors.payerCountry}
              aria-describedby={errors.payerCountry ? 'payerCountry-error' : undefined}
              className={getInputClassName(!!errors.payerCountry, isSubmitting)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Recipient Information Section */}
      <FormSection title="Recipient Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Recipient Name"
            required
            error={errors.recipientName?.message}
            className="md:col-span-2"
          >
            <input
              {...register('recipientName')}
              type="text"
              id="recipientName"
              placeholder="John Doe"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.recipientName}
              aria-describedby={errors.recipientName ? 'recipientName-error' : undefined}
              className={getInputClassName(!!errors.recipientName, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Recipient TIN"
            required
            error={errors.recipientTIN?.message}
            helperText="Format: XXX-XX-XXXX"
          >
            <input
              {...register('recipientTIN')}
              type="text"
              id="recipientTIN"
              placeholder="123-45-6789"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.recipientTIN}
              aria-describedby={errors.recipientTIN ? 'recipientTIN-error' : 'recipientTIN-helper'}
              className={getInputClassName(!!errors.recipientTIN, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Account Number"
            error={errors.accountNumber?.message}
          >
            <input
              {...register('accountNumber')}
              type="text"
              id="accountNumber"
              placeholder="1234567890"
              disabled={isSubmitting}
              aria-invalid={!!errors.accountNumber}
              aria-describedby={errors.accountNumber ? 'accountNumber-error' : undefined}
              className={getInputClassName(!!errors.accountNumber, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Street Address"
            error={errors.recipientStreetAddress?.message}
            className="md:col-span-2"
          >
            <input
              {...register('recipientStreetAddress')}
              type="text"
              id="recipientStreetAddress"
              placeholder="456 Oak Avenue"
              disabled={isSubmitting}
              aria-invalid={!!errors.recipientStreetAddress}
              aria-describedby={errors.recipientStreetAddress ? 'recipientStreetAddress-error' : undefined}
              className={getInputClassName(!!errors.recipientStreetAddress, isSubmitting)}
            />
          </FormField>

          <FormField
            label="City"
            error={errors.recipientCity?.message}
          >
            <input
              {...register('recipientCity')}
              type="text"
              id="recipientCity"
              placeholder="Los Angeles"
              disabled={isSubmitting}
              aria-invalid={!!errors.recipientCity}
              aria-describedby={errors.recipientCity ? 'recipientCity-error' : undefined}
              className={getInputClassName(!!errors.recipientCity, isSubmitting)}
            />
          </FormField>

          <FormField
            label="State"
            error={errors.recipientState?.message}
            helperText="2-letter code (e.g., CA)"
          >
            <input
              {...register('recipientState')}
              type="text"
              id="recipientState"
              placeholder="CA"
              maxLength={2}
              disabled={isSubmitting}
              aria-invalid={!!errors.recipientState}
              aria-describedby={errors.recipientState ? 'recipientState-error' : 'recipientState-helper'}
              className={getInputClassName(!!errors.recipientState, isSubmitting)}
            />
          </FormField>

          <FormField
            label="ZIP Code"
            error={errors.recipientZip?.message}
          >
            <input
              {...register('recipientZip')}
              type="text"
              id="recipientZip"
              placeholder="90001"
              disabled={isSubmitting}
              aria-invalid={!!errors.recipientZip}
              aria-describedby={errors.recipientZip ? 'recipientZip-error' : undefined}
              className={getInputClassName(!!errors.recipientZip, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Country"
            error={errors.recipientCountry?.message}
          >
            <input
              {...register('recipientCountry')}
              type="text"
              id="recipientCountry"
              placeholder="USA"
              disabled={isSubmitting}
              aria-invalid={!!errors.recipientCountry}
              aria-describedby={errors.recipientCountry ? 'recipientCountry-error' : undefined}
              className={getInputClassName(!!errors.recipientCountry, isSubmitting)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Dividend Information Section */}
      <FormSection title="Dividend Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Total Ordinary Dividends (Box 1a)"
            required
            error={errors.totalOrdinaryDividends?.message}
            helperText="Amount with up to 2 decimal places"
          >
            <input
              {...register('totalOrdinaryDividends')}
              type="text"
              id="totalOrdinaryDividends"
              placeholder="1000.00"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.totalOrdinaryDividends}
              aria-describedby={errors.totalOrdinaryDividends ? 'totalOrdinaryDividends-error' : 'totalOrdinaryDividends-helper'}
              className={getInputClassName(!!errors.totalOrdinaryDividends, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Qualified Dividends (Box 1b)"
            error={errors.qualifiedDividends?.message}
            helperText="Amount with up to 2 decimal places"
          >
            <input
              {...register('qualifiedDividends')}
              type="text"
              id="qualifiedDividends"
              placeholder="800.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.qualifiedDividends}
              aria-describedby={errors.qualifiedDividends ? 'qualifiedDividends-error' : 'qualifiedDividends-helper'}
              className={getInputClassName(!!errors.qualifiedDividends, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Total Capital Gain Distributions (Box 2a)"
            error={errors.totalCapitalGainDistributions?.message}
          >
            <input
              {...register('totalCapitalGainDistributions')}
              type="text"
              id="totalCapitalGainDistributions"
              placeholder="500.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.totalCapitalGainDistributions}
              aria-describedby={errors.totalCapitalGainDistributions ? 'totalCapitalGainDistributions-error' : undefined}
              className={getInputClassName(!!errors.totalCapitalGainDistributions, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Unrecaptured Section 1250 Gain (Box 2b)"
            error={errors.unrecapturedSection1250Gain?.message}
          >
            <input
              {...register('unrecapturedSection1250Gain')}
              type="text"
              id="unrecapturedSection1250Gain"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.unrecapturedSection1250Gain}
              aria-describedby={errors.unrecapturedSection1250Gain ? 'unrecapturedSection1250Gain-error' : undefined}
              className={getInputClassName(!!errors.unrecapturedSection1250Gain, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Section 1202 Gain (Box 2c)"
            error={errors.section1202Gain?.message}
          >
            <input
              {...register('section1202Gain')}
              type="text"
              id="section1202Gain"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.section1202Gain}
              aria-describedby={errors.section1202Gain ? 'section1202Gain-error' : undefined}
              className={getInputClassName(!!errors.section1202Gain, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Collectibles (28%) Gain (Box 2d)"
            error={errors.collectibles28Gain?.message}
          >
            <input
              {...register('collectibles28Gain')}
              type="text"
              id="collectibles28Gain"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.collectibles28Gain}
              aria-describedby={errors.collectibles28Gain ? 'collectibles28Gain-error' : undefined}
              className={getInputClassName(!!errors.collectibles28Gain, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Section 897 Ordinary Dividends (Box 2e)"
            error={errors.section897OrdinaryDividends?.message}
          >
            <input
              {...register('section897OrdinaryDividends')}
              type="text"
              id="section897OrdinaryDividends"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.section897OrdinaryDividends}
              aria-describedby={errors.section897OrdinaryDividends ? 'section897OrdinaryDividends-error' : undefined}
              className={getInputClassName(!!errors.section897OrdinaryDividends, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Section 897 Capital Gain (Box 2f)"
            error={errors.section897CapitalGain?.message}
          >
            <input
              {...register('section897CapitalGain')}
              type="text"
              id="section897CapitalGain"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.section897CapitalGain}
              aria-describedby={errors.section897CapitalGain ? 'section897CapitalGain-error' : undefined}
              className={getInputClassName(!!errors.section897CapitalGain, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Nondividend Distributions (Box 3)"
            error={errors.nondividendDistributions?.message}
          >
            <input
              {...register('nondividendDistributions')}
              type="text"
              id="nondividendDistributions"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.nondividendDistributions}
              aria-describedby={errors.nondividendDistributions ? 'nondividendDistributions-error' : undefined}
              className={getInputClassName(!!errors.nondividendDistributions, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Section 199A Dividends (Box 5)"
            error={errors.section199ADividends?.message}
          >
            <input
              {...register('section199ADividends')}
              type="text"
              id="section199ADividends"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.section199ADividends}
              aria-describedby={errors.section199ADividends ? 'section199ADividends-error' : undefined}
              className={getInputClassName(!!errors.section199ADividends, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Cash Liquidation Distributions (Box 8)"
            error={errors.cashLiquidationDistributions?.message}
          >
            <input
              {...register('cashLiquidationDistributions')}
              type="text"
              id="cashLiquidationDistributions"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.cashLiquidationDistributions}
              aria-describedby={errors.cashLiquidationDistributions ? 'cashLiquidationDistributions-error' : undefined}
              className={getInputClassName(!!errors.cashLiquidationDistributions, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Noncash Liquidation Distributions (Box 9)"
            error={errors.noncashLiquidationDistributions?.message}
          >
            <input
              {...register('noncashLiquidationDistributions')}
              type="text"
              id="noncashLiquidationDistributions"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.noncashLiquidationDistributions}
              aria-describedby={errors.noncashLiquidationDistributions ? 'noncashLiquidationDistributions-error' : undefined}
              className={getInputClassName(!!errors.noncashLiquidationDistributions, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Investment Expenses (Box 10)"
            error={errors.investmentExpenses?.message}
          >
            <input
              {...register('investmentExpenses')}
              type="text"
              id="investmentExpenses"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.investmentExpenses}
              aria-describedby={errors.investmentExpenses ? 'investmentExpenses-error' : undefined}
              className={getInputClassName(!!errors.investmentExpenses, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Exempt-Interest Dividends (Box 11)"
            error={errors.exemptInterestDividends?.message}
          >
            <input
              {...register('exemptInterestDividends')}
              type="text"
              id="exemptInterestDividends"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.exemptInterestDividends}
              aria-describedby={errors.exemptInterestDividends ? 'exemptInterestDividends-error' : undefined}
              className={getInputClassName(!!errors.exemptInterestDividends, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Specified Private Activity Bond Interest (Box 12)"
            error={errors.specifiedPrivateActivityBondInterest?.message}
          >
            <input
              {...register('specifiedPrivateActivityBondInterest')}
              type="text"
              id="specifiedPrivateActivityBondInterest"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.specifiedPrivateActivityBondInterest}
              aria-describedby={errors.specifiedPrivateActivityBondInterest ? 'specifiedPrivateActivityBondInterest-error' : undefined}
              className={getInputClassName(!!errors.specifiedPrivateActivityBondInterest, isSubmitting)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Tax Withholding Section */}
      <FormSection title="Tax Withholding">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Federal Income Tax Withheld (Box 4)"
            error={errors.federalIncomeTaxWithheld?.message}
          >
            <input
              {...register('federalIncomeTaxWithheld')}
              type="text"
              id="federalIncomeTaxWithheld"
              placeholder="150.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.federalIncomeTaxWithheld}
              aria-describedby={errors.federalIncomeTaxWithheld ? 'federalIncomeTaxWithheld-error' : undefined}
              className={getInputClassName(!!errors.federalIncomeTaxWithheld, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Foreign Tax Paid (Box 6)"
            error={errors.foreignTaxPaid?.message}
          >
            <input
              {...register('foreignTaxPaid')}
              type="text"
              id="foreignTaxPaid"
              placeholder="75.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.foreignTaxPaid}
              aria-describedby={errors.foreignTaxPaid ? 'foreignTaxPaid-error' : undefined}
              className={getInputClassName(!!errors.foreignTaxPaid, isSubmitting)}
            />
          </FormField>

          <FormField
            label="Foreign Country (Box 7)"
            error={errors.foreignCountry?.message}
            className="md:col-span-2"
          >
            <input
              {...register('foreignCountry')}
              type="text"
              id="foreignCountry"
              placeholder="United Kingdom"
              disabled={isSubmitting}
              aria-invalid={!!errors.foreignCountry}
              aria-describedby={errors.foreignCountry ? 'foreignCountry-error' : undefined}
              className={getInputClassName(!!errors.foreignCountry, isSubmitting)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* State Tax Information Section */}
      <FormSection title="State Tax Information">
        <div className="space-y-6">
          {/* First State */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">State 1</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="State (Box 13)"
                error={errors.state?.message}
                helperText="2-letter code"
              >
                <input
                  {...register('state')}
                  type="text"
                  id="state"
                  placeholder="NY"
                  maxLength={2}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.state}
                  aria-describedby={errors.state ? 'state-error' : 'state-helper'}
                  className={getInputClassName(!!errors.state, isSubmitting)}
                />
              </FormField>

              <FormField
                label="State ID Number (Box 14)"
                error={errors.stateIdentificationNumber?.message}
              >
                <input
                  {...register('stateIdentificationNumber')}
                  type="text"
                  id="stateIdentificationNumber"
                  placeholder="12-3456789"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.stateIdentificationNumber}
                  aria-describedby={errors.stateIdentificationNumber ? 'stateIdentificationNumber-error' : undefined}
                  className={getInputClassName(!!errors.stateIdentificationNumber, isSubmitting)}
                />
              </FormField>

              <FormField
                label="State Tax Withheld (Box 15)"
                error={errors.stateTaxWithheld?.message}
              >
                <input
                  {...register('stateTaxWithheld')}
                  type="text"
                  id="stateTaxWithheld"
                  placeholder="50.00"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.stateTaxWithheld}
                  aria-describedby={errors.stateTaxWithheld ? 'stateTaxWithheld-error' : undefined}
                  className={getInputClassName(!!errors.stateTaxWithheld, isSubmitting)}
                />
              </FormField>
            </div>
          </div>

          {/* Second State */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">State 2 (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="State (Box 13)"
                error={errors.state2?.message}
                helperText="2-letter code"
              >
                <input
                  {...register('state2')}
                  type="text"
                  id="state2"
                  placeholder="CA"
                  maxLength={2}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.state2}
                  aria-describedby={errors.state2 ? 'state2-error' : 'state2-helper'}
                  className={getInputClassName(!!errors.state2, isSubmitting)}
                />
              </FormField>

              <FormField
                label="State ID Number (Box 14)"
                error={errors.stateIdentificationNumber2?.message}
              >
                <input
                  {...register('stateIdentificationNumber2')}
                  type="text"
                  id="stateIdentificationNumber2"
                  placeholder="98-7654321"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.stateIdentificationNumber2}
                  aria-describedby={errors.stateIdentificationNumber2 ? 'stateIdentificationNumber2-error' : undefined}
                  className={getInputClassName(!!errors.stateIdentificationNumber2, isSubmitting)}
                />
              </FormField>

              <FormField
                label="State Tax Withheld (Box 15)"
                error={errors.stateTaxWithheld2?.message}
              >
                <input
                  {...register('stateTaxWithheld2')}
                  type="text"
                  id="stateTaxWithheld2"
                  placeholder="25.00"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.stateTaxWithheld2}
                  aria-describedby={errors.stateTaxWithheld2 ? 'stateTaxWithheld2-error' : undefined}
                  className={getInputClassName(!!errors.stateTaxWithheld2, isSubmitting)}
                />
              </FormField>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Additional Options Section */}
      <FormSection title="Additional Options">
        <div className="space-y-3">
          <CheckboxField
            label="Voided"
            helperText="Mark this form as voided"
            {...register('voided')}
            disabled={isSubmitting}
          />

          <CheckboxField
            label="Corrected"
            helperText="This is a correction of a previously filed form"
            {...register('corrected')}
            disabled={isSubmitting}
          />

          <CheckboxField
            label="Second TIN Notification"
            helperText="IRS has notified payer twice that recipient's TIN is incorrect"
            {...register('secondTinNotification')}
            disabled={isSubmitting}
          />

          <CheckboxField
            label="FATCA Filing Requirement"
            helperText="FATCA filing requirement checkbox"
            {...register('fatcaFilingRequirement')}
            disabled={isSubmitting}
          />
        </div>
      </FormSection>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full md:w-auto min-w-[200px]"
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText="Generating Preview..."
        >
          Generate Preview
        </Button>
      </div>
    </form>
  );
}

/**
 * FormSection Component
 * 
 * Renders a section of the form with a title and children
 */
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

/**
 * FormField Component
 * 
 * Renders a form field with label, input, error message, and helper text
 */
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({ 
  label, 
  required, 
  error, 
  helperText, 
  children,
  className 
}: FormFieldProps) {
  // Extract the input ID from children for proper label association
  const inputId = React.isValidElement(children) && children.props.id 
    ? children.props.id 
    : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p 
          id={inputId ? `${inputId}-helper` : undefined}
          className="text-xs text-gray-500"
        >
          {helperText}
        </p>
      )}
      {error && (
        <div
          id={inputId ? `${inputId}-error` : undefined}
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 flex items-start"
        >
          <svg
            className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * CheckboxField Component
 * 
 * Renders a checkbox input with label and helper text
 */
interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, helperText, id, disabled, ...props }, ref) => {
    const checkboxId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            aria-label={label}
            aria-describedby={helperText ? `${checkboxId}-helper` : undefined}
            className={cn(
              'w-4 h-4 rounded border-gray-300 text-blue-600',
              'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'transition-colors duration-200',
              disabled && 'cursor-not-allowed opacity-60'
            )}
            {...props}
          />
        </div>
        <div className="ml-3">
          <label 
            htmlFor={checkboxId}
            className={cn(
              'text-sm font-medium text-gray-700',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            {label}
          </label>
          {helperText && (
            <p 
              id={`${checkboxId}-helper`}
              className="text-xs text-gray-500 mt-0.5"
            >
              {helperText}
            </p>
          )}
        </div>
      </div>
    );
  }
);

CheckboxField.displayName = 'CheckboxField';

/**
 * Utility function to generate input className based on state
 */
function getInputClassName(hasError: boolean, isDisabled: boolean): string {
  return cn(
    // Base styles
    'w-full px-3 py-2 rounded-md border text-base text-gray-900',
    'transition-colors duration-200',
    'placeholder:text-gray-400',
    
    // Focus styles
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    
    // Mobile-first: touch-friendly sizing (minimum 44x44px)
    'min-h-[44px] text-base',
    
    // Tablet and desktop: slightly smaller
    'md:min-h-[40px] md:text-sm',
    
    // State-based styles
    hasError
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 focus-visible:ring-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-blue-500',
    
    // Disabled state
    isDisabled && 'bg-gray-100 cursor-not-allowed opacity-60'
  );
}
