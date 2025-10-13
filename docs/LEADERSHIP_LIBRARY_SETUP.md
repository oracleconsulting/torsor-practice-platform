# 📚 Leadership Library - Setup Guide

## Overview
The Leadership Library is a curated collection of leadership, personal development, and management books integrated with your team's CPD and development plans.

---

## 📁 Step 1: Upload Book Cover Images

### Location:
```
torsor-practice-platform/public/images/leadership-library/
```

### Image Requirements:
- **Format**: JPG, PNG, or WebP
- **Size**: Recommended 400px width × 600px height (2:3 ratio)
- **File naming**: Use kebab-case (lowercase with hyphens)
  - ✅ Good: `seven-habits-highly-effective-people.jpg`
  - ✅ Good: `how-to-win-friends-influence-people.png`
  - ❌ Bad: `Seven Habits.jpg` (spaces, capitals)

### Example:
```bash
# Your file structure should look like:
public/images/leadership-library/
├── seven-habits-highly-effective-people.jpg
├── good-to-great.jpg
├── leaders-eat-last.jpg
└── dare-to-lead.jpg
```

---

## 📝 Step 2: Prepare Book Data

### Data Format (SQL INSERT)

For each book, prepare an INSERT statement like this:

```sql
INSERT INTO leadership_library (
  title,
  author,
  isbn,
  publication_year,
  cover_image_path,
  short_summary,
  key_points,
  detailed_summary,
  primary_category,
  secondary_categories,
  difficulty_level,
  relevant_skills,
  topics,
  target_audience,
  recommended_for_roles,
  recommended_reading_time_hours,
  practical_exercises,
  amazon_link
) VALUES (
  'The 7 Habits of Highly Effective People',
  'Stephen R. Covey',
  '9780743269513',
  1989,
  '/images/leadership-library/seven-habits-highly-effective-people.jpg',
  'A holistic approach to personal effectiveness through seven timeless principles. Focuses on character development and aligning actions with core values.',
  ARRAY[
    'Be Proactive - Take responsibility for your life',
    'Begin with the End in Mind - Define your mission and goals',
    'Put First Things First - Prioritize important over urgent',
    'Think Win-Win - Seek mutual benefit in relationships',
    'Seek First to Understand, Then to Be Understood - Practice empathetic listening',
    'Synergize - Value differences and creative cooperation',
    'Sharpen the Saw - Continuous self-renewal and improvement'
  ],
  'A comprehensive guide to personal and interpersonal effectiveness based on principles rather than quick fixes. Covey presents seven habits that transform how we approach work, relationships, and life. The book emphasizes character ethics over personality ethics, encouraging readers to align their actions with universal principles. Each habit builds on the previous ones, starting with personal mastery (habits 1-3), moving to collaborative effectiveness (habits 4-6), and culminating in continuous renewal (habit 7). The book includes practical exercises, real-world examples, and a framework for implementing each habit in daily life.',
  'Personal Development',
  ARRAY['Leadership', 'Time Management', 'Communication'],
  'intermediate',
  ARRAY['Time Management', 'Goal Setting', 'Communication', 'Leadership'],
  ARRAY['Personal Effectiveness', 'Character Development', 'Time Management', 'Interpersonal Skills'],
  ARRAY['All Levels', 'New Managers', 'Directors'],
  ARRAY['Staff', 'Manager', 'Director', 'Partner'],
  15,
  true,
  'https://www.amazon.co.uk/dp/0743269519'
);
```

---

## 🎯 Step 3: Book Data Template

Use this template for each book. I recommend creating this in a spreadsheet first, then converting to SQL.

### Required Fields:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| **title** | Text | "Dare to Lead" | Full book title |
| **author** | Text | "Brené Brown" | Author name(s) |
| **cover_image_path** | Text | "/images/leadership-library/dare-to-lead.jpg" | Path to cover image |
| **short_summary** | Text | "Research-based guide to brave leadership..." | 2-3 sentences for gallery view |
| **key_points** | Array | See examples below | 5-10 bullet points |
| **primary_category** | Text | "Leadership" | Main category |

### Optional but Recommended:

| Field | Type | Example |
|-------|------|---------|
| **isbn** | Text | "9781785042140" |
| **publication_year** | Number | 2018 |
| **detailed_summary** | Text | Full paragraph (300-500 words) |
| **secondary_categories** | Array | `['Communication', 'Culture']` |
| **difficulty_level** | Text | 'beginner', 'intermediate', or 'advanced' |
| **topics** | Array | `['Vulnerability', 'Trust', 'Courage']` |
| **target_audience** | Array | `['Leaders', 'Managers', 'All Levels']` |
| **recommended_reading_time_hours** | Number | 12 |
| **practical_exercises** | Boolean | true/false |
| **amazon_link** | Text | Full Amazon UK link |

---

## 📊 Categories Reference

### Primary Categories:
- **Leadership** - Leading teams, vision, strategy
- **Personal Development** - Self-improvement, habits, mindset
- **Communication** - Listening, influence, difficult conversations
- **Management** - Operations, delegation, performance
- **Culture** - Building teams, organizational culture
- **Change Management** - Leading change, transformation
- **Decision Making** - Critical thinking, problem solving
- **Emotional Intelligence** - Self-awareness, empathy, relationships

### Topics (Examples):
- Goal Setting
- Time Management
- Delegation
- Conflict Resolution
- Trust Building
- Accountability
- Innovation
- Strategic Thinking
- Coaching & Mentoring
- Performance Management
- Team Building
- Resilience
- Authenticity
- Feedback

### Target Audience:
- All Levels
- New Managers
- Experienced Managers
- Directors
- Partners/Owners
- Technical Professionals
- Client-Facing Roles

---

## 🔗 Step 4: Link to Skills

### Relevant Skills (from your skills matrix):

When filling `relevant_skills`, use these skill names to link books to your team's development needs:

**Advisory Skills:**
- Strategic Business Planning
- Business Advisory
- Financial Analysis & Forecasting
- etc.

**Client Management:**
- Client Relationship Management
- Difficult Conversations
- etc.

**Leadership:**
- Team Leadership
- Delegation & Empowerment
- etc.

**Communication:**
- Active Listening
- Presentation Skills
- etc.

---

## 📋 Sample Books to Get Started

Here are some quick wins - classic leadership books you likely have:

1. **The 7 Habits of Highly Effective People** - Stephen Covey
2. **How to Win Friends and Influence People** - Dale Carnegie
3. **Leaders Eat Last** - Simon Sinek
4. **Good to Great** - Jim Collins
5. **Dare to Lead** - Brené Brown
6. **The Five Dysfunctions of a Team** - Patrick Lencioni
7. **Drive** - Daniel Pink
8. **Crucial Conversations** - Kerry Patterson
9. **Emotional Intelligence 2.0** - Travis Bradberry
10. **The One Minute Manager** - Ken Blanchard

---

## 🚀 Step 5: Add Books to Database

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file first: `20251013_leadership_library.sql`
3. Then run INSERT statements for each book

### Option 2: Bulk Import

Create a file `add_books.sql` with all your INSERT statements, then run it in SQL Editor.

---

## 📸 Step 6: Getting Book Covers

### Sources:
1. **Amazon** - Right-click cover → Save image
2. **Goodreads** - High-quality covers
3. **Google Images** - Search "[book title] cover" → Tools → Size → Large
4. **Publisher websites**

### Quick Tip:
Take screenshots of book covers from your bookshelf or Kindle library if you own them!

---

## 🎨 Step 7: Access the Library

Once books are added:
1. Go to **Team Management** page
2. Click **"Knowledge Base"** tab
3. You'll see the **Leadership Library** gallery

---

## 📚 Example: Complete Book Entry

```sql
INSERT INTO leadership_library (
  title, author, isbn, publication_year,
  cover_image_path, short_summary, key_points,
  primary_category, secondary_categories, difficulty_level,
  topics, target_audience, recommended_reading_time_hours,
  practical_exercises, amazon_link
) VALUES (
  'Radical Candor',
  'Kim Scott',
  '9781509845385',
  2017,
  '/images/leadership-library/radical-candor.jpg',
  'A framework for being a better boss through caring personally while challenging directly. Learn to give feedback that helps people improve without crushing their spirits.',
  ARRAY[
    'Care Personally + Challenge Directly = Radical Candor',
    'Ruinous Empathy: Caring without challenging',
    'Obnoxious Aggression: Challenging without caring',
    'Manipulative Insincerity: Neither caring nor challenging',
    'Give immediate, specific, and humble feedback',
    'Solicit feedback constantly to improve',
    'Build trust before giving criticism'
  ],
  'Leadership',
  ARRAY['Communication', 'Management'],
  'intermediate',
  ARRAY['Feedback', 'Trust Building', 'Team Management', 'Difficult Conversations'],
  ARRAY['Managers', 'Directors', 'Team Leaders'],
  10,
  true,
  'https://www.amazon.co.uk/dp/1509845380'
);
```

---

## ✅ Checklist

Before adding a book, ensure you have:
- [ ] Book cover image (400×600px, JPG/PNG)
- [ ] Uploaded to `/public/images/leadership-library/`
- [ ] Book title and author
- [ ] Short summary (2-3 sentences)
- [ ] 5-10 key points
- [ ] Primary category
- [ ] Target audience
- [ ] Estimated reading time

---

## 🤝 Integration with Development Plans

Once books are in the library, they will:
- ✅ Appear in the Knowledge Base gallery
- ✅ Be searchable by category, topic, and skill
- ✅ Be recommended based on skill gaps
- ✅ Link to CPD activities
- ✅ Track completion and ratings
- ✅ Generate personalized reading lists

---

## 📞 Need Help?

If you need assistance:
1. Preparing book data in bulk
2. Finding book covers
3. Linking books to specific skills
4. Custom categories

Just let me know! I can help batch process your book collection.


