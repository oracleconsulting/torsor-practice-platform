// TransformationJourney.tsx
// Components for rendering the "travel agent" view of the discovery analysis
// Sells the destination, not the planes

// ============================================================================
// TYPES
// ============================================================================

export interface TransformationPhase {
  phase: number;
  timeframe: string;
  title: string;
  youWillHave: string;
  whatChanges: string;
  enabledBy: string;
  enabledByCode: string;
  investment: string;
}

export interface TransformationJourneyData {
  destination: string;
  totalInvestment: string;
  totalTimeframe: string;
  phases: TransformationPhase[];
}

export interface InvestmentSummaryData {
  totalFirstYearInvestment: string;
  projectedFirstYearReturn: string;
  paybackPeriod: string;
}

// ============================================================================
// DESTINATION HERO
// The beach, not the plane. This is what they're buying.
// ============================================================================

export function DestinationHero({ 
  destination, 
  totalTimeframe 
}: Readonly<{ 
  destination: string; 
  totalTimeframe: string;
}>) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white mb-8">
      <p className="text-emerald-200 text-sm font-medium uppercase tracking-wide mb-2">
        Your Destination
      </p>
      <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
        {destination}
      </h2>
      <p className="text-emerald-100 text-lg">
        {totalTimeframe}
      </p>
    </div>
  );
}

// ============================================================================
// JOURNEY PHASE CARD
// A postcard from the future - what their life looks like at this point
// ============================================================================

export function JourneyPhaseCard({ 
  phase, 
  isLast 
}: Readonly<{ 
  phase: TransformationPhase; 
  isLast: boolean;
}>) {
  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 to-emerald-100" />
      )}
      
      <div className="flex gap-4">
        {/* Phase number bubble */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
          {phase.phase}
        </div>
        
        {/* Phase content */}
        <div className="flex-1 pb-8">
          {/* Timeframe badge */}
          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            {phase.timeframe}
          </span>
          
          {/* Phase title - the milestone */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {phase.title}
          </h3>
          
          {/* What you'll have - the postcard */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-3">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
              You'll have
            </p>
            <p className="text-gray-800 leading-relaxed">
              {phase.youWillHave}
            </p>
          </div>
          
          {/* What changes - the shift */}
          <p className="text-emerald-700 font-medium italic mb-3">
            "{phase.whatChanges}"
          </p>
          
          {/* Enabled by — full string already includes price */}
          <div className="text-sm text-gray-500">
            <span>
              Enabled by: <span className="font-medium text-gray-700">{phase.enabledBy}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// JOURNEY TIMELINE
// The full journey from here to the destination
// ============================================================================

export function JourneyTimeline({ 
  phases 
}: Readonly<{ 
  phases: TransformationPhase[];
}>) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Your Journey
      </h3>
      <div className="space-y-2">
        {phases.map((phase, index) => (
          <JourneyPhaseCard 
            key={phase.phase} 
            phase={phase} 
            isLast={index === phases.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// INVESTMENT SUMMARY
// The price of the ticket - but framed as investment in the destination
// ============================================================================

export function InvestmentSummary({
  totalInvestment,
  projectedReturn,
  paybackPeriod,
  destination
}: Readonly<{
  totalInvestment: string;
  projectedReturn: string;
  paybackPeriod: string;
  destination: string;
}>) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Investment Summary
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">To start the journey</p>
          <p className="text-2xl font-bold text-emerald-600">{totalInvestment}</p>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Expected return</p>
          <p className="text-2xl font-bold text-emerald-600">{projectedReturn}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Payback period</p>
          <p className="text-2xl font-bold text-emerald-600">{paybackPeriod}</p>
        </div>
      </div>
      
      <p className="text-center text-gray-600 text-sm">
        The investment in reaching: <span className="font-medium">{destination}</span>
      </p>
    </div>
  );
}

// ============================================================================
// HORIZONTAL JOURNEY VIEW
// For wider screens - shows the journey as a horizontal timeline
// ============================================================================

export function HorizontalJourneyView({
  phases
}: Readonly<{
  phases: TransformationPhase[];
}>) {
  return (
    <div className="hidden lg:block mb-8 overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Your Journey
      </h3>
      <div className="flex gap-4 min-w-max pb-4">
        {phases.map((phase, index) => (
          <div key={phase.phase} className="flex items-center">
            {/* Phase card */}
            <div className="w-72 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {phase.phase}
                </div>
                <span className="text-xs font-semibold text-emerald-700">
                  {phase.timeframe}
                </span>
              </div>
              
              <h4 className="font-bold text-gray-900 mb-2">{phase.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{phase.youWillHave}</p>
              <p className="text-xs text-emerald-600 italic mb-2">"{phase.whatChanges}"</p>
              
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>{phase.enabledBy}</span>
              </div>
            </div>
            
            {/* Arrow connector */}
            {index < phases.length - 1 && (
              <div className="px-2">
                <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN TRANSFORMATION JOURNEY COMPONENT
// ============================================================================

export function TransformationJourney({
  journey,
  investmentSummary
}: Readonly<{
  journey: TransformationJourneyData;
  investmentSummary: InvestmentSummaryData;
}>) {
  if (!journey?.phases?.length) {
    return null;
  }

  return (
    <div className="transformation-journey">
      {/* The destination - lead with where they're going */}
      <DestinationHero 
        destination={journey.destination}
        totalTimeframe={journey.totalTimeframe}
      />
      
      {/* The journey - show horizontal on desktop, vertical on mobile */}
      <HorizontalJourneyView phases={journey.phases} />
      <div className="lg:hidden">
        <JourneyTimeline phases={journey.phases} />
      </div>
      
      {/* The investment - price of the ticket */}
      <InvestmentSummary
        totalInvestment={journey.totalInvestment}
        projectedReturn={investmentSummary.projectedFirstYearReturn}
        paybackPeriod={investmentSummary.paybackPeriod}
        destination={journey.destination}
      />
    </div>
  );
}

export default TransformationJourney;



