# Continuity Scorecard Widget

## Overview

The Continuity Scorecard Widget is a comprehensive business continuity and succession planning tool designed specifically for UK accounting practices. It addresses the critical gap where less than 10% of practices have proper succession plans, helping practices protect their value and ensure smooth transitions.

## Features

### 1. Practice Valuation Calculator
- **Multiple Valuation Methods**: GRF (Gross Recurring Fees), EBITDA, and Hybrid approaches
- **Dynamic Adjustments**: Client concentration, growth rate, and profitability factors
- **Historical Tracking**: Monitor value changes over time
- **Industry Benchmarking**: Compare against industry standards

### 2. Digital Executor Vault
- **Secure Credential Management**: Encrypted storage of critical passwords and access details
- **Executor Setup**: Primary and secondary executor configuration with access delays
- **Critical Contacts**: Important business contact directory
- **Document Storage**: Secure storage of essential business documents

### 3. Readiness Assessment
- **Comprehensive Scoring**: 0-100 readiness score across four categories
- **Gap Analysis**: Automated identification of critical gaps
- **Action Planning**: Recommended actions to improve readiness
- **Progress Tracking**: Monitor improvements over time

### 4. Growth Analytics
- **Value Projections**: 1, 3, and 5-year value forecasts
- **Improvement Opportunities**: Quantified impact of addressing gaps
- **Benchmark Comparison**: Industry performance analysis
- **Key Metrics**: Client count, recurring revenue, valuation multiples

## Technical Implementation

### Architecture
```
ContinuityScorecardWidget.tsx (Main Widget)
├── ContinuityDashboard.tsx (Modal Dashboard)
    ├── ValuationPanel.tsx (Practice Valuation)
    ├── ExecutorVault.tsx (Digital Executor)
    ├── ReadinessCenter.tsx (Readiness Assessment)
    └── GrowthAnalytics.tsx (Growth Analytics)
```

### Security Features
- **Credential Encryption**: Simple XOR encryption with base64 encoding
- **Time-locked Access**: Delayed access tokens for executors
- **Password Strength**: Built-in password strength checker
- **Secure Vault**: Isolated credential management system

### Data Models

#### Practice Valuation
```typescript
interface PracticeValuation {
  id: string;
  practiceId: string;
  valuationDate: Date;
  methodology: 'GRF' | 'EBITDA' | 'HYBRID';
  grf: { /* Gross Recurring Fees data */ };
  ebitda: { /* EBITDA data */ };
  perClient: { /* Per client data */ };
  calculatedValue: number;
  previousValue: number;
  growthRate: number;
}
```

#### Executor Pack
```typescript
interface ExecutorPack {
  id: string;
  practiceId: string;
  executors: { primary: Executor; secondary?: Executor };
  credentials: Credential[];
  criticalContacts: CriticalContact[];
  documents: ContinuityDocument[];
}
```

#### Readiness Assessment
```typescript
interface ReadinessAssessment {
  score: number; // 0-100
  lastAssessed: Date;
  categories: {
    documentation: ReadinessCategory;
    financial: ReadinessCategory;
    operational: ReadinessCategory;
    legal: ReadinessCategory;
  };
}
```

## API Integration

### Endpoints
- `POST /api/accountancy/continuity/valuation/calculate` - Calculate practice value
- `GET /api/accountancy/continuity/valuation/history` - Get valuation history
- `POST /api/accountancy/continuity/vault/credential` - Save encrypted credential
- `PUT /api/accountancy/continuity/vault/executor` - Update executor details
- `GET /api/accountancy/continuity/readiness/assess` - Assess readiness
- `PATCH /api/accountancy/continuity/readiness` - Update readiness items
- `GET /api/accountancy/continuity/summary` - Get continuity summary
- `GET /api/accountancy/continuity/export/succession-pack` - Export succession pack

### Mock Data
The widget includes comprehensive mock data for demonstration:
- Practice value: £1.25m with 12.5% growth
- Readiness score: 68/100 with identified gaps
- 2 executors and 15 stored credentials
- 425 active clients with 85% recurring revenue

## Usage

### Widget Display
The main widget shows:
- Current practice value with growth indicator
- Readiness score with color-coded progress bar
- Executor and credential counts
- Critical gaps summary
- Next assessment date
- Quick action buttons

### Dashboard Access
Clicking "View Details" opens the full dashboard with:
- **Practice Valuation**: Methodology selection and detailed calculations
- **Digital Executor**: Executor management and credential vault
- **Readiness Assessment**: Category-based assessment with gap analysis
- **Growth Analytics**: Projections and benchmarking

## Business Value

### For Accounting Practices
1. **Protect Practice Value**: Understand and maximize practice worth
2. **Ensure Continuity**: Proper succession planning and documentation
3. **Reduce Risk**: Identify and address critical gaps
4. **Generate Revenue**: Offer continuity services to clients

### For Clients
1. **Succession Planning**: Help clients plan for business transitions
2. **Value Maximization**: Identify opportunities to increase business value
3. **Risk Management**: Address operational and financial risks
4. **Compliance**: Ensure regulatory compliance and best practices

## Future Enhancements

### Planned Features
- **AI-Powered Insights**: Machine learning for gap detection and recommendations
- **Integration APIs**: Connect with accounting software and banking systems
- **Mobile App**: Dedicated mobile application for executors
- **Advanced Encryption**: Enterprise-grade encryption and key management
- **Multi-Factor Authentication**: Enhanced security for vault access
- **Automated Monitoring**: Real-time monitoring of readiness factors

### Advanced Analytics
- **Predictive Modeling**: AI-driven value projections
- **Scenario Planning**: What-if analysis for different scenarios
- **Market Intelligence**: Real-time market data integration
- **Peer Comparison**: Anonymous peer benchmarking

## Security Considerations

### Current Implementation
- Simple XOR encryption for demonstration
- Base64 encoding for credential storage
- Time-locked access tokens
- Password strength validation

### Production Requirements
- AES-256 encryption for credentials
- Hardware Security Modules (HSM) for key management
- Multi-factor authentication
- Audit logging and monitoring
- Regular security assessments
- Compliance with GDPR and data protection regulations

## Testing

### Test Coverage
- [ ] Valuation calculations accuracy
- [ ] Encryption/decryption functionality
- [ ] Time-delayed access controls
- [ ] Multi-factor authentication
- [ ] Export functionality
- [ ] Mobile biometric access
- [ ] Performance with large vaults

### Mock Data Validation
- [ ] Practice valuation calculations
- [ ] Readiness assessment scoring
- [ ] Gap detection algorithms
- [ ] Growth projection accuracy
- [ ] Benchmark comparison logic

## Dependencies

### Core Dependencies
- React 18 with TypeScript
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling

### Optional Dependencies
- Recharts for advanced visualizations
- React Hook Form for form management
- CryptoJS for enhanced encryption (production)

## Configuration

### Widget Registry
The widget is registered in `src/config/widgetRegistry.ts`:
```typescript
{
  id: 'continuity-scorecard',
  name: 'Practice Continuity',
  description: 'Track practice value, plan succession, and maintain business continuity',
  component: ContinuityScorecardWidget,
  defaultSize: 'large',
  category: 'business-intelligence',
  requiredPermissions: ['accountancy'],
  priority: 14,
  isNew: true,
  beta: false,
  tags: ['succession', 'valuation', 'continuity', 'planning'],
  icon: 'briefcase',
  color: 'purple'
}
```

### Environment Variables
- `VITE_API_URL`: API endpoint for continuity services
- `VITE_ENCRYPTION_KEY`: Master encryption key (production only)

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## License

This widget is part of the Oracle Accountancy Portal and is subject to the same licensing terms as the main application. 