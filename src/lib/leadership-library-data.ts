/**
 * Leadership Library Data
 * Loads from LEADERSHIP_LIBRARY_30.csv in public/data/
 */

export interface LeadershipBook {
  book_id: string;
  book_title: string;
  author: string;
  publication_year: string;
  cover_image_filename: string;
  short_summary: string;
  full_summary: string;
  target_audience: string;
  estimated_read_time_hours: number;
  primary_category: string;
  secondary_categories: string[];
  skill_tags: string[];
  leadership_competencies: string[];
  technical_skills: string[];
  soft_skills: string[];
  behavioral_outcomes: string[];
  key_concepts: string[];
  key_frameworks_models: string;
  case_studies_examples: string;
  practical_exercises: string;
  recommended_for_roles: string[];
  prerequisite_knowledge: string;
  difficulty_level: string;
  cpd_hours_value: number;
  learning_objectives: string[];
  actionable_takeaways: string[];
  best_for_scenarios: string[];
  related_books: string[];
  quotes: string[];
  isbn: string;
  amazon_link: string;
  goodreads_rating: number;
}

// Parse CSV helper
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  return result;
}

// Load books from CSV
export async function loadLeadershipLibrary(): Promise<LeadershipBook[]> {
  try {
    const response = await fetch('/data/leadership-library.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Skip header
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      const fields = parseCSVLine(line);
      
      return {
        book_id: fields[0] || '',
        book_title: fields[1] || '',
        author: fields[2] || '',
        publication_year: fields[3] || '',
        cover_image_filename: fields[4] || '',
        short_summary: fields[5] || '',
        full_summary: fields[6] || '',
        target_audience: fields[7] || 'All Levels',
        estimated_read_time_hours: parseFloat(fields[8]) || 10,
        primary_category: fields[9] || '',
        secondary_categories: fields[10]?.split('|').filter(Boolean) || [],
        skill_tags: fields[11]?.split('|').filter(Boolean) || [],
        leadership_competencies: fields[12]?.split('|').filter(Boolean) || [],
        technical_skills: fields[13]?.split('|').filter(Boolean) || [],
        soft_skills: fields[14]?.split('|').filter(Boolean) || [],
        behavioral_outcomes: fields[15]?.split('|').filter(Boolean) || [],
        key_concepts: fields[16]?.split('|').filter(Boolean) || [],
        key_frameworks_models: fields[17] || '',
        case_studies_examples: fields[18] || '',
        practical_exercises: fields[19] || '',
        recommended_for_roles: fields[20]?.split('|').filter(Boolean) || [],
        prerequisite_knowledge: fields[21] || 'None',
        difficulty_level: fields[22] || 'Beginner',
        cpd_hours_value: parseFloat(fields[23]) || 10,
        learning_objectives: fields[24]?.split('|').filter(Boolean) || [],
        actionable_takeaways: fields[25]?.split('|').filter(Boolean) || [],
        best_for_scenarios: fields[26]?.split('|').filter(Boolean) || [],
        related_books: fields[27]?.split('|').filter(Boolean) || [],
        quotes: fields[28]?.split('"|"').map(q => q.replace(/^"|"$/g, '')).filter(Boolean) || [],
        isbn: fields[29] || '',
        amazon_link: fields[30] || '',
        goodreads_rating: parseFloat(fields[31]) || 4.0,
      };
    });
  } catch (error) {
    console.error('Error loading leadership library:', error);
    return [];
  }
}

// Helper function to get book image URL
export function getBookCoverUrl(filename: string): string {
  return `/images/leadership-library/${filename}`;
}

// Helper function to search books
export function searchLeadershipBooks(books: LeadershipBook[], query: string): LeadershipBook[] {
  const lowerQuery = query.toLowerCase();
  return books.filter(book =>
    book.book_title.toLowerCase().includes(lowerQuery) ||
    book.author.toLowerCase().includes(lowerQuery) ||
    book.short_summary.toLowerCase().includes(lowerQuery) ||
    book.key_concepts.some(concept => concept.toLowerCase().includes(lowerQuery))
  );
}

// Helper function to filter by category
export function filterBooksByCategory(books: LeadershipBook[], category: string): LeadershipBook[] {
  return books.filter(book =>
    book.primary_category === category ||
    book.secondary_categories.includes(category)
  );
}

// Helper function to filter by difficulty
export function filterBooksByDifficulty(books: LeadershipBook[], difficulty: string): LeadershipBook[] {
  return books.filter(book =>
    book.difficulty_level === difficulty
  );
}

// Helper function to get related books
export function getRelatedBooks(books: LeadershipBook[], bookId: string): LeadershipBook[] {
  const book = books.find(b => b.book_id === bookId);
  if (!book) return [];
  
  return books.filter(b =>
    book.related_books.some(related => 
      b.book_title.toLowerCase().includes(related.toLowerCase())
    )
  );
}

