
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import PDFParser from 'pdf2json';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('[ANALYZE] Request received at:', new Date().toISOString());
  
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      console.log('[ANALYZE] Error: No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('[ANALYZE] File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('[ANALYZE] Buffer created, size:', buffer.length, 'bytes');

    console.log('[ANALYZE] Starting PDF parsing...');
    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, true); // true = text content only

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('[ANALYZE] PDF parsing error:', errData.parserError);
        reject(errData.parserError);
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {      
        console.log('[ANALYZE] PDF parsing completed successfully');
        const extractedText = pdfParser.getRawTextContent();
        console.log('[ANALYZE] Extracted text:', extractedText);
        console.log('[ANALYZE] Extracted text length:', extractedText.length, 'characters');
        resolve(extractedText);
      });

      pdfParser.parseBuffer(buffer);
    });

    console.log('[ANALYZE] Starting ATS scoring analysis...');
    
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
    const sectionScore = Math.min(20, (sectionsFound / 4) * 20);
    score += sectionScore;
    console.log('[ANALYZE] Section check:', {
      sectionsFound,
      totalSections: sections.length,
      scoreAdded: sectionScore
    });

    // 2. Keyword Analysis (Action Verbs) (30 points)
    const actionVerbs = ['developed', 'managed', 'led', 'created', 'implemented', 'designed', 'improved', 'analyzed', 'collaborated', 'achieved'];
    let verbsFound = 0;
    actionVerbs.forEach(verb => {
      if (new RegExp(`\\b${verb}\\b`, 'i').test(text)) {
        verbsFound++;
        keywordsFound.push(verb);
      }
    });
    const verbScore = Math.min(30, (verbsFound / 5) * 30);
    score += verbScore;
    console.log('[ANALYZE] Keyword analysis:', {
      verbsFound,
      keywordsFound,
      scoreAdded: verbScore
    });

    // 3. Contact Info Check (10 points)
    const hasEmail = /@/.test(text);
    const hasPhone = /\d{3}[-.\\s]?\d{3}[-.\\s]?\d{4}/.test(text);
    
    if (hasEmail) score += 5;
    else suggestions.push('Email address not found.');
    
    if (hasPhone) score += 5;
    else suggestions.push('Phone number not found or not in standard format.');
    
    console.log('[ANALYZE] Contact info check:', {
      hasEmail,
      hasPhone,
      scoreAdded: (hasEmail ? 5 : 0) + (hasPhone ? 5 : 0)
    });

    // 4. Content Length (20 points)
    const wordCount = text.split(/\s+/).length;
    let lengthScore = 0;
    if (wordCount >= 400 && wordCount <= 1000) {
      lengthScore = 20;
      score += 20;
    } else if (wordCount < 400) {
      lengthScore = 10;
      score += 10;
      suggestions.push('Resume might be too short. Aim for 400-1000 words.');
    } else {
      lengthScore = 10;
      score += 10;
      suggestions.push('Resume might be too long. Keep it concise.');
    }
    console.log('[ANALYZE] Content length check:', {
      wordCount,
      scoreAdded: lengthScore
    });

    // 5. File Format (Free 20 points since we only allow PDF)
    score += 20;
    console.log('[ANALYZE] File format: PDF (20 points)');

    const finalScore = Math.round(score);
    console.log('[ANALYZE] Final score calculated:', {
      rawScore: score,
      finalScore,
      totalSuggestions: suggestions.length,
      totalKeywords: keywordsFound.length
    });

    const response = {
      score: finalScore,
      suggestions,
      keywordsFound,
      details: {
        wordCount,
        sectionsFound
      }
    };

    console.log('[ANALYZE] Sending successful response');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[ANALYZE] Error parsing resume:', error);
    console.error('[ANALYZE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
