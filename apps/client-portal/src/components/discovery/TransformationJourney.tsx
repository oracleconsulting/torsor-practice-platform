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
  destinationLabel?: string;      // "YOUR 5-YEAR DESTINATION" or "IN 12 MONTHS..."
  destination?: string;           // The vision quote
  destinationContext?: string;    // "This is what 5 years builds" or "This is what £13,300 builds"
  journeyLabel?: string;          // "THE FOUNDATIONS" or "YOUR JOURNEY"
  totalInvestment?: string;
  totalTimeframe?: string;        // "12 months to foundations; 3-5 years to destination"
  phases?: TransformationPhase[];
}

export interface InvestmentSummaryData {
  totalFirstYearInvestment?: string;
  projectedFirstYearReturn?: string;
  paybackPeriod?: string;
  investmentAsPercentOfRevenue?: string;
}

// ============================================================================
// DESTINATION HERO
// The beach, not the plane. This is what they're buying.
// ============================================================================

export function DestinationHero({ 
  destinationLabel,
  destination, 
  destinationContext,
  totalInvestment,
  totalTimeframe 
}: Readonly<{ 
  destinationLabel?: string;
  destination?: string;
  destinationContext?: string;
  totalInvestment?: string;
  totalTimeframe?: string;
}>) {
  if (!destination) {
    return null;
  }
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white mb-8">
      <p className="text-emerald-200 text-sm font-medium uppercase tracking-wide mb-2">
        {destinationLabel || "In 12 months, you could be..."}
      </p>
      <div className="bg-white/15 border border-white/30 rounded-xl p-6 md:p-8 mb-4">
        <h2 className="text-xl md:text-2xl font-bold mb-3 leading-tight italic">
          "{destination}"
        </h2>
      </div>
      {destinationContext && (
        <p className="text-emerald-100 text-base md:text-lg">
          {destinationContext}
        </p>
      )}
      {!destinationContext && totalInvestment && (
        <p className="text-emerald-100 text-base md:text-lg">
          This is what {totalInvestment} and 12 months builds.
        </p>
      )}
      {!destinationContext && !totalInvestment && totalTimeframe && (
        <p className="text-emerald-100 text-base md:text-lg">
          {totalTimeframe}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// TIMELINE VISUAL
// Shows the progression: Now → Month 3 → Month 6 → Month 12
// ============================================================================

export function TimelineVisual() {
  return (
    <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto py-4">
      {['Now', 'Month 3', 'Month 6', 'Month 12'].map((label, idx) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-teal-600 border-2 border-white shadow-md" />
            <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>
          </div>
          {idx < 3 && (
            <div className="w-8 md:w-12 lg:w-20 h-0.5 bg-gradient-to-r from-teal-300 to-teal-100 mx-1" />
          )}
        </div>
      ))}
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
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
          {phase.phase}
        </div>
        
        {/* Phase content */}
        <div className="flex-1 pb-6">
          {/* Timeframe badge */}
          <span className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            {phase.timeframe}
          </span>
          
          {/* Phase title - the milestone */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            {phase.title}
          </h3>
          
          {/* What you'll have - the postcard */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm mb-3">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
              You'll have
            </p>
            <p className="text-gray-800 leading-relaxed text-sm md:text-base">
              {phase.youWillHave}
            </p>
          </div>
          
          {/* What changes - the shift */}
          <p className="text-teal-700 font-medium italic mb-3 text-sm md:text-base">
            "{phase.whatChanges}"
          </p>
          
          {/* Enabled by - the plane (small, footnote-style) */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Enabled by: <span className="font-medium text-gray-700">{phase.enabledBy}</span>
            </span>
            <span className="font-semibold text-teal-600">
              {phase.investment}
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
  phases?: TransformationPhase[];
}>) {
  if (!phases || phases.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {phases.map((phase, index) => (
        <JourneyPhaseCard 
          key={phase.phase} 
          phase={phase} 
          isLast={index === phases.length - 1}
        />
      ))}
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
  investmentSummary?: InvestmentSummaryData;
}>) {
  if (!journey?.phases?.length || !journey.destination) {
    return null;
  }

  return (
    <div className="transformation-journey">
      {/* The destination - lead with where they're going */}
      <DestinationHero 
        destinationLabel={journey.destinationLabel}
        destination={journey.destination}
        destinationContext={journey.destinationContext}
        totalInvestment={journey.totalInvestment}
        totalTimeframe={journey.totalTimeframe}
      />
      
      {/* Timeline visual */}
      <TimelineVisual />
      
      {/* Section title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {journey.journeyLabel || "Your Journey"}
      </h3>
      <p className="text-gray-600 text-sm mb-6">
        The path from here to your destination
      </p>
      
      {/* The journey - vertical timeline */}
      <JourneyTimeline phases={journey.phases} />
    </div>
  );
}

export default TransformationJourney;

