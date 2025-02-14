import { NextResponse } from 'next/server'
import { parse } from 'csv-parse'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file contents
    const fileContents = await file.text()

    // Parse CSV to validate structure
    const records: string[][] = []
    
    const parser = parse(fileContents, {
      skip_empty_lines: true
    })

    for await (const record of parser) {
      records.push(record)
    }

    // Validate that CSV has at least 3 columns for output selection
    if (records[0].length < 3) {
      return NextResponse.json(
        { error: 'CSV must have at least 3 columns' },
        { status: 400 }
      )
    }

    // Store the CSV data in session or database
    // For now, we'll just return success
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      rowCount: records.length - 1 // Excluding header row
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
} 