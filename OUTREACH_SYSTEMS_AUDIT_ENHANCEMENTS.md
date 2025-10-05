# TORSOR Portal Enhancements - Client Outreach & Systems Audit
**Date:** October 5, 2025  
**Status:** ✅ Complete

---

## 🎯 Overview

Major enhancements to the TORSOR Accounting Portal focusing on two key areas:
1. **Client Outreach** - Advanced tracking and analysis tools for finding acquisition targets
2. **Systems Audit** - Reframed from IT security to business operations efficiency

---

## 📊 1. SYSTEMS AUDIT - Complete Rewrite

### What Changed
Transformed from an IT/Security audit tool to a **Business Operations Efficiency Analyzer** focused on:
- Invoicing systems
- Payment collection
- Expense management
- Payroll processing
- Inventory management
- Procurement systems
- Banking reconciliation
- Financial reporting

### New Features

#### 1.1 Business-Focused Categories
- **Invoicing** - Invoice generation and delivery automation
- **Payments** - Payment collection and cashflow optimization
- **Expense Management** - Expense tracking and approval workflows
- **Payroll** - Payroll processing systems
- **Inventory Management** - Stock control and tracking
- **Procurement** - Purchase order systems
- **Banking** - Bank reconciliation automation
- **Reporting** - Financial dashboard and KPI reporting

#### 1.2 New Status Types
- **Optimized** - System is efficient and well-implemented
- **Needs Attention** - System works but has room for improvement
- **Inefficient** - System is costing time/money and needs urgent attention
- **Pending Review** - System hasn't been assessed yet

#### 1.3 Potential Savings Dashboard
Each audit now shows:
- **Time Savings** - Hours saved per month
- **Cost Reduction** - £ saved per month
- **Cashflow Improvement** - £ improved cashflow

#### 1.4 Detailed Recommendations
Each system audit item includes:
- **Potential Savings** - Monetary value of optimization
- **Efficiency Gain** - Percentage or time improvement
- **Specific Recommendations** - Actionable steps to improve

### Example Audit Items

```typescript
{
  category: 'Invoicing',
  system: 'Invoice Generation & Delivery',
  description: 'Manual invoice creation taking 2 hours per week',
  status: 'inefficient',
  priority: 'high',
  potentialSavings: '£400/month',
  efficiencyGain: '87% time saved',
  recommendation: 'Implement automated invoicing system (Xero/QuickBooks)'
}
```

### Files Modified
- `/torsor-practice-platform/src/pages/SystemsAuditPage.tsx` - Complete rewrite

---

## 🔍 2. CLIENT OUTREACH - Enhanced Features

### 2.1 Date Range Comparison

**Purpose:** Track client registrations at accounting firms over time to identify:
- Firms that have **left** an accountant (potential clients available)
- Firms that have **joined** an accountant (potential acquisition targets)
- **Stable** client base at competing firms

**Features:**
- Compare two date ranges side-by-side
- Visual indicators for new firms (green), left firms (red), unchanged (blue)
- Export comparison results for analysis
- Automatic saving to search history

**Use Cases:**
1. **Track Acquisitions** - See which firms are acquiring clients
2. **Find Available Clients** - Identify firms that left their accountant
3. **Market Analysis** - Understand client movement patterns
4. **Competitive Intelligence** - Monitor competitor client bases

**Component:** `DateRangeComparison.tsx`

### 2.2 Search History

**Purpose:** Save and recall previous searches for efficiency and pattern tracking

**Features:**
- Automatic saving of all searches (address matches, date ranges, comparisons)
- View last 50 searches with timestamps
- One-click reload of previous searches
- Delete unwanted history items
- Shows search type and results count

**Database Table:** `outreach_search_history`
- Stores search parameters
- Practice-level access control
- RLS policies for security

**Component:** `SearchHistoryPanel.tsx`
**Migration:** `20250105_outreach_search_history.sql`

### 2.3 Enhanced Export with ALL Fields

**Purpose:** Export comprehensive company data including ALL publicly available information

**Features:**
- Export all Companies House data fields
- Include officers, filing history, charges, PSC data
- Optional LLM-verified addresses
- CSV and JSON formats
- Batch export support

**Service Methods:**
```typescript
comprehensiveExportWithAllFields(address, includeLLMVerification)
```

### 2.4 LLM Address Verification

**Purpose:** Use AI (GPT-5/Perplexity) to verify real trading and contact addresses (not just registered offices)

**Why This Matters:**
- Registered offices are often accountants' offices (can't reach out there!)
- Need actual trading addresses for outreach
- AI can search public records, websites, and directories
- Saves hours of manual research

**Features:**
- **Single verification** - Verify one company at a time
- **Batch verification** - Process multiple companies automatically
- **Confidence scoring** - AI rates accuracy of found addresses
- **Source tracking** - Shows where information was found
- **Progress tracking** - Real-time updates during batch processing

**Results Include:**
- Trading address (where they actually do business)
- Contact address (where to send mail)
- Confidence score (0-100%)
- Sources used (website, directories, public records)
- Notes from AI analysis

**Component:** `LLMAddressVerification.tsx`

**Service Methods:**
```typescript
verifyAddressWithLLM(companyData)        // Single company
batchVerifyAddresses(companies)          // Multiple companies
```

---

## 🗃️ Database Changes

### New Table: `outreach_search_history`

```sql
CREATE TABLE outreach_search_history (
  id UUID PRIMARY KEY,
  practice_id UUID,
  search_type TEXT,              -- 'address_match', 'date_range', 'date_comparison'
  address TEXT,
  date_range JSONB,
  date_ranges JSONB,
  results_count INTEGER,
  filters JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Indexes:**
- `idx_search_history_practice` - Fast practice lookups
- `idx_search_history_created` - Sort by date
- `idx_search_history_type` - Filter by search type

**Security:**
- Row-Level Security enabled
- Users can only access their practice's history
- Automatic cleanup via CASCADE delete

---

## 📁 New Files Created

### Components
1. **`DateRangeComparison.tsx`** - Date range comparison UI
2. **`SearchHistoryPanel.tsx`** - Search history sidebar
3. **`LLMAddressVerification.tsx`** - AI address verification UI
4. **`EnhancedOutreachSearch.tsx`** - Main wrapper component

### Database
5. **`20250105_outreach_search_history.sql`** - Search history table migration

### Services (Updated)
6. **`outreachService.ts`** - Added new methods:
   - `searchByAddressWithDateRange()`
   - `compareDateRanges()`
   - `saveSearchHistory()`
   - `getSearchHistory()`
   - `deleteSearchHistory()`
   - `loadSearchFromHistory()`
   - `verifyAddressWithLLM()`
   - `batchVerifyAddresses()`
   - `comprehensiveExportWithAllFields()`

---

## 🔌 API Integration Required

The frontend is ready, but the **backend API endpoints** need to be implemented in `oracle_api_server`:

### Required Endpoints

```
POST /api/outreach/enhanced-search/address-date-range
  - Search companies at address within date range
  
POST /api/outreach/enhanced-search/compare-date-ranges
  - Compare two date ranges to find differences
  
POST /api/outreach/llm-verify-address
  - Single company address verification via LLM
  
POST /api/outreach/llm-verify-addresses-batch
  - Batch address verification
  
POST /api/outreach/enhanced-search/export-all-fields
  - Comprehensive export with all available data
```

### LLM Integration Notes
- Use **GPT-5** (OpenAI) or **Perplexity** API
- Search web for company trading addresses
- Check company websites, Google Maps, business directories
- Return structured JSON with addresses and confidence scores
- Rate limit to avoid excessive API costs

---

## 🚀 Usage Guide

### For Systems Audit

1. Navigate to **Systems Audit** in TORSOR
2. Select a client or view "All Clients"
3. Review audit items by category (Invoicing, Payments, etc.)
4. Click on items to see:
   - Current status
   - Potential savings
   - Efficiency gains
   - Specific recommendations
5. Filter by category to focus on specific systems
6. Export reports for client meetings

### For Client Outreach

#### Date Range Comparison
1. Go to **Client Outreach** → **Date Range Comparison**
2. Enter the accounting firm's registered office address
3. Set Period 1 (earlier time range)
4. Set Period 2 (later time range)
5. Click **"Compare Periods"**
6. Review results:
   - **New Firms** - Potential acquisition targets
   - **Left Firms** - Available clients to approach
   - **Unchanged** - Stable client base
7. Export results for analysis

#### Search History
1. View past searches in the right sidebar
2. Click any search to reload it instantly
3. Delete searches you no longer need
4. History automatically saves all your searches

#### LLM Address Verification
1. After running an address search
2. Go to **Address Verification** tab
3. Click **"Verify All Addresses"**
4. Wait for AI to process (shows progress)
5. Review verified addresses:
   - Trading address (actual business location)
   - Contact address (for outreach)
   - Confidence scores
6. Export verified data for your outreach campaign

---

## 💡 Business Value

### Systems Audit
- **Client Retention** - Show tangible value by identifying savings
- **Upsell Opportunities** - Recommend system improvements
- **Advisory Services** - Position as business efficiency expert
- **Differentiation** - Stand out from basic compliance accountants

### Client Outreach
- **Better Targeting** - Find firms actively changing accountants
- **Competitive Intelligence** - Track competitor client bases
- **Higher Success Rates** - Contact at right addresses
- **Time Savings** - Automate address verification
- **Data-Driven** - Make decisions based on real patterns

---

## 🎯 Next Steps

1. **Backend Implementation**
   - Implement API endpoints in `oracle_api_server`
   - Set up LLM integration (GPT-5 or Perplexity)
   - Add date range filtering to Companies House queries

2. **Testing**
   - Test date range comparisons with real data
   - Verify LLM address accuracy
   - Check export functionality

3. **Documentation**
   - Create user guide for accountants
   - Add video tutorials
   - Document best practices

4. **Future Enhancements**
   - Email outreach templates using verified addresses
   - Automated monitoring of competitor movements
   - Integration with CRM systems
   - Advanced analytics and reporting

---

## 📝 Technical Notes

### Dependencies Added
- `date-fns` - For date formatting in search history
- Existing: React, TypeScript, Tailwind, shadcn/ui

### Environment Variables (Backend)
```
OPENAI_API_KEY=xxx           # For GPT-5 address verification
PERPLEXITY_API_KEY=xxx       # Alternative LLM option
COMPANIES_HOUSE_API_KEY=xxx  # Already exists
```

### Performance Considerations
- Search history limited to 50 recent searches
- LLM verification uses batch processing for efficiency
- Progress tracking for long-running batch operations
- Exports use streaming for large datasets

---

## ✅ Summary

**Systems Audit:**
- ✅ Completely rewritten to focus on business operations
- ✅ New categories: Invoicing, Payments, Expenses, etc.
- ✅ Shows potential savings and efficiency gains
- ✅ Actionable recommendations for each system

**Client Outreach:**
- ✅ Date range comparison for tracking firm movements
- ✅ Search history with save/recall functionality
- ✅ Enhanced export with comprehensive data
- ✅ LLM-powered address verification (GPT-5/Perplexity)

**Database:**
- ✅ New `outreach_search_history` table with RLS

**Frontend:**
- ✅ 4 new components created
- ✅ Services updated with new methods
- ✅ Full TypeScript typing

**Backend (Required):**
- ⏳ API endpoints need implementation
- ⏳ LLM integration setup needed

---

**All frontend work is complete and ready for backend integration!** 🎉

