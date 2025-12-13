/**
 * Mechanical cleanup for LLM outputs
 * Enforces British English and removes AI-ish patterns
 */

export function cleanMechanical(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // ========================================
    // British English spellings
    // ========================================
    .replace(/\boptimize/gi, 'optimise')
    .replace(/\boptimizing/gi, 'optimising')
    .replace(/\boptimized/gi, 'optimised')
    .replace(/\boptimization/gi, 'optimisation')
    .replace(/\banalyze/gi, 'analyse')
    .replace(/\banalyzing/gi, 'analysing')
    .replace(/\banalyzed/gi, 'analysed')
    .replace(/\banalysis/gi, 'analysis') // keep as is
    .replace(/\brealize/gi, 'realise')
    .replace(/\brealizing/gi, 'realising')
    .replace(/\brealized/gi, 'realised')
    .replace(/\bbehavior/gi, 'behaviour')
    .replace(/\bbehaviors/gi, 'behaviours')
    .replace(/\bbehavioral/gi, 'behavioural')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bcentered/gi, 'centred')
    .replace(/\bprogram\b/gi, 'programme')
    .replace(/\bprograms\b/gi, 'programmes')
    .replace(/\borganize/gi, 'organise')
    .replace(/\borganizing/gi, 'organising')
    .replace(/\borganized/gi, 'organised')
    .replace(/\borganization/gi, 'organisation')
    .replace(/\bfavor\b/gi, 'favour')
    .replace(/\bfavors\b/gi, 'favours')
    .replace(/\bfavorite/gi, 'favourite')
    .replace(/\bcolor/gi, 'colour')
    .replace(/\bcolors/gi, 'colours')
    .replace(/\bhonor/gi, 'honour')
    .replace(/\bhonors/gi, 'honours')
    .replace(/\brecognize/gi, 'recognise')
    .replace(/\brecognizing/gi, 'recognising')
    .replace(/\brecognized/gi, 'recognised')
    .replace(/\bspecialize/gi, 'specialise')
    .replace(/\bspecializing/gi, 'specialising')
    .replace(/\bspecialized/gi, 'specialised')
    .replace(/\bcatalog/gi, 'catalogue')
    .replace(/\bdialog\b/gi, 'dialogue')
    .replace(/\blabor/gi, 'labour')
    .replace(/\bneighbor/gi, 'neighbour')
    .replace(/\bpractice\b/gi, (match) => match) // keep practice as noun
    .replace(/\bpracticing/gi, 'practising')
    .replace(/\blicensing/gi, 'licensing') // same in UK
    .replace(/\bfulfill/gi, 'fulfil')
    .replace(/\bfulfillment/gi, 'fulfilment')
    
    // ========================================
    // Remove AI patterns that slip through
    // ========================================
    .replace(/Here's the thing[:\s]*/gi, '')
    .replace(/Here's the truth[:\s]*/gi, '')
    .replace(/Here's what I see[:\s]*/gi, '')
    .replace(/Here's what we see[:\s]*/gi, '')
    .replace(/Here's what I also see[:\s]*/gi, '')
    .replace(/But here's what I also see[:\s]*/gi, '')
    .replace(/Here's another[^.]+\.\s*/gi, '')
    .replace(/Let me be direct[:\s]*/gi, '')
    .replace(/Let me be honest[:\s]*/gi, '')
    .replace(/I want to be direct with you[:\s]*/gi, '')
    .replace(/I want to be honest[:\s]*/gi, '')
    .replace(/You've done the hard work of [^.]+\.\s*/gi, '')
    .replace(/It doesn't mean [^.]+\. It means /gi, 'It means ')
    .replace(/That's not a fantasy\.\s*/gi, '')
    .replace(/That's not a dream\.\s*/gi, '')
    .replace(/At the end of the day,?\s*/gi, '')
    .replace(/To be honest,?\s*/gi, '')
    .replace(/Quite frankly,?\s*/gi, '')
    .replace(/The reality is,?\s*/gi, '')
    .replace(/Moving forward,?\s*/gi, '')
    .replace(/Going forward,?\s*/gi, '')
    .replace(/In a world where[^,]+,\s*/gi, '')
    
    // ========================================
    // Clean up corporate jargon
    // ========================================
    .replace(/\blow-hanging fruit\b/gi, 'quick wins')
    .replace(/\bmove the needle\b/gi, 'make progress')
    .replace(/\bboil the ocean\b/gi, 'try to do everything')
    .replace(/\bcircle back\b/gi, 'return to')
    .replace(/\btouch base\b/gi, 'check in')
    
    // ========================================
    // Clean up spacing and formatting
    // ========================================
    .replace(/  +/g, ' ')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
}

/**
 * Recursively clean all string fields in an object
 */
export function cleanAllStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return cleanMechanical(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanAllStrings(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanAllStrings(obj[key]);
    }
    return cleaned;
  }
  
  return obj;
}

