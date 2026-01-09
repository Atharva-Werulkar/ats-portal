
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import PDFParser from 'pdf2json';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, true); // true = text content only

      pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        // Raw text content is usually in pdfParser.getRawTextContent() which returns a string
        resolve(pdfParser.getRawTextContent());
      });

      pdfParser.parseBuffer(buffer);
    });

    // --- Basic ATS Scoring Logic ---
    let score = 0;
    const suggestions: string[] = [];
    const keywordsFound: string[] = [];

    // 1. Check for Standard Sections (20 points)
    const sections = ['Education', 'Experience', 'Skills', 'Projects', 'Summary', 'Objective'];
    let sectionsFound = 0;
    sections.forEach(section => {
      if (new RegExp(section, 'i').test(text)) {
        sectionsFound++;
      } else {
        suggestions.push(`Missing section: ${section}`);
      }
    });
    score += Math.min(20, (sectionsFound / 4) * 20); // Cap at 20

    // 2. Keyword Analysis (Action Verbs) (30 points)
    const actionVerbs = ['developed', 'managed', 'led', 'created', 'implemented', 'designed', 'improved', 'analyzed', 'collaborated', 'achieved'];
    let verbsFound = 0;
    actionVerbs.forEach(verb => {
      if (new RegExp(`\\b${verb}\\b`, 'i').test(text)) {
        verbsFound++;
        keywordsFound.push(verb);
      }
    });
    score += Math.min(30, (verbsFound / 5) * 30); // Cap at 30, expect at least 5 unique verbs

    // 3. Contact Info Check (10 points)
    if (/@/.test(text)) score += 5;
    else suggestions.push('Email address not found.');
    
    // Simple phone check
    if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) score += 5;
    else suggestions.push('Phone number not found or not in standard format.');

    // 4. Content Length (20 points)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 400 && wordCount <= 1000) {
      score += 20;
    } else if (wordCount < 400) {
      score += 10;
      suggestions.push('Resume might be too short. Aim for 400-1000 words.');
    } else {
      score += 10;
      suggestions.push('Resume might be too long. Keep it concise.');
    }

    // 5. File Format (Free 20 points since we only allow PDF)
    score += 20;

    return NextResponse.json({
      score: Math.round(score),
      suggestions,
      keywordsFound,
      details: {
        wordCount,
        sectionsFound
      }
    });

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
