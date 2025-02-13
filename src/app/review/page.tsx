'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface ReviewData {
  rowData: string[];
  score: string;
  response: string;
}

// Add these type definitions at the top of the file
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type FormattedValue = string | React.ReactNode;

const parseAndFormatCell = (cell: string): React.ReactNode => {
  // Update the formatValue function with proper types
  const formatValue = (value: JsonValue, depth: number = 0): FormattedValue => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div className={`space-y-1 ${depth > 0 ? 'mt-1' : ''}`}>
          {Object.entries(value).map(([nestedKey, nestedValue], i) => (
            <div 
              key={i} 
              className={`pl-2 border-l-2 border-gray-200 ${depth > 0 ? 'ml-2' : ''}`}
            >
              <span className="text-sm font-medium text-gray-600">
                {nestedKey}:
              </span>{' '}
              <span className="text-sm">
                {formatValue(nestedValue, depth + 1)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Return primitive values as strings
    return String(value);
  };

  try {
    // Check if the string looks like JSON
    if (cell?.trim().startsWith('{') || cell?.trim().startsWith('[')) {
      const parsed = JSON.parse(cell) as JsonValue;
      
      // If it's an object or array
      if (typeof parsed === 'object' && parsed !== null) {
        return formatValue(parsed);
      }
    }
    // If not JSON or parsing fails, return as is
    return cell;
  } catch {  // Remove the parameter entirely since we're not using it
    // If JSON parsing fails, return original string
    return cell;
  }
};

export default function ReviewPage() {
  const router = useRouter()
  const [currentRowIndex, setCurrentRowIndex] = useState(0)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [reviewedData, setReviewedData] = useState<ReviewData[]>([])
  const [score, setScore] = useState('')
  const [response, setResponse] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const storedData = localStorage.getItem('csvData')
    if (storedData) {
      try {
        const parsedData: ParsedData = JSON.parse(storedData)
        setHeaders(parsedData.headers)
        setRows(parsedData.rows)
      } catch (err) {
        console.error("Error parsing stored CSV data:", err)
        router.push('/upload')
      }
    } else {
      router.push('/upload')
    }
  }, [router])

  const handleDownload = () => {
    try {
      // Remove SME Output from headers
      const headerRow = [...headers, 'Score', 'Response'].join(',')
      
      const dataRows = reviewedData.map(review => {
        const escapedRowData = review.rowData.map(cell => {
          if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });

        const escapedResponse = review.response.includes(',') || 
                              review.response.includes('"') || 
                              review.response.includes('\n')
          ? `"${review.response.replace(/"/g, '""')}"`
          : review.response;

        const escapedScore = review.score.includes(',') || 
                           review.score.includes('"') || 
                           review.score.includes('\n')
          ? `"${review.score.replace(/"/g, '""')}"`
          : review.score;

        // Remove escapedOutput and only include score and response
        return [...escapedRowData, escapedScore, escapedResponse].join(',');
      }).join('\n');

      // Combine headers and data
      const fullCsvContent = headerRow + '\n' + dataRows;
      
      // Create and trigger download
      const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'reviewed_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
    }
  };

  const handleNext = () => {
    saveCurrentReview()
    if (currentRowIndex < rows.length - 1) {
      setCurrentRowIndex(prev => prev + 1)
      loadReviewData(currentRowIndex + 1)
    } else {
      setIsComplete(true)
    }
  }

  const handlePrevious = () => {
    saveCurrentReview()
    if (currentRowIndex > 0) {
      setCurrentRowIndex(prev => prev - 1)
      loadReviewData(currentRowIndex - 1)
    }
  }

  const saveCurrentReview = () => {
    if (!currentRow) return;
    
    const updatedReviewedData = [...reviewedData];
    updatedReviewedData[currentRowIndex] = {
      rowData: currentRow,
      score: score || '',
      response: response || ''
    };
    setReviewedData(updatedReviewedData);
    localStorage.setItem('reviewedData', JSON.stringify(updatedReviewedData));
  };

  const loadReviewData = (index: number) => {
    const existingReview = reviewedData[index]
    if (existingReview) {
      setScore(existingReview.score || '')
      setResponse(existingReview.response)
    } else {
      setScore('')
      setResponse('')
    }
  }

  const handleSaveAndExit = () => {
    saveCurrentReview()
    
    try {
      const headerRow = [...headers, 'Score', 'Response'].join(',')
      
      const dataRows = reviewedData.map(review => {
        const escapedRowData = review.rowData.map(cell => {
          if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });

        const escapedResponse = review.response.includes(',') || 
                              review.response.includes('"') || 
                              review.response.includes('\n')
          ? `"${review.response.replace(/"/g, '""')}"`
          : review.response;

        const escapedScore = review.score.includes(',') || 
                           review.score.includes('"') || 
                           review.score.includes('\n')
          ? `"${review.score.replace(/"/g, '""')}"`
          : review.score;

        return [...escapedRowData, escapedScore, escapedResponse].join(',');
      }).join('\n');

      // Combine headers and data
      const fullCsvContent = headerRow + '\n' + dataRows;
      
      // Create and trigger download
      const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'reviewed_data_partial.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
    }

    router.push('/upload')
  }

  const handleRowNavigation = (rowNumber: string) => {
    const newIndex = parseInt(rowNumber) - 1
    if (isNaN(newIndex) || newIndex < 0 || newIndex >= rows.length) return
    
    saveCurrentReview()
    setCurrentRowIndex(newIndex)
    loadReviewData(newIndex)
  }

  if (!rows.length) return <div>Loading...</div>

  // Show completion screen if all rows are reviewed
  if (isComplete) {
    return (
      <div className="container mx-auto p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Review Complete!</CardTitle>
            <CardDescription>You have reviewed all rows in the CSV file.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-green-50">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  All {rows.length} rows have been reviewed successfully.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={handleDownload} size="lg">
                  Download Results
                </Button>
                <Button 
                  onClick={() => router.push('/upload')} 
                  variant="outline"
                  size="lg"
                >
                  Upload New File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRow = rows[currentRowIndex]
  //const outputColumns = currentRow ? [currentRow[1], currentRow[3], currentRow[5]] : [] // IMPORTANT: Assuming the output columns are the 2nd, 3rd, and 4th columns. This can be changed to the actual columns that are being used.

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review Data</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Row</span>
              <input
                type="number"
                min={1}
                max={rows.length}
                value={currentRowIndex + 1}
                onChange={(e) => handleRowNavigation(e.target.value)}
                className="w-16 px-2 py-1 border rounded text-center"
              />
              <span className="text-sm text-gray-500">of {rows.length}</span>
            </div>
          </div>
          <CardDescription>Review the data and select an output</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Campaign Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Campaign</h3>
              <div className="space-y-4">
                {currentRow[0] && (
                  <div className="border p-2 rounded w-full">
                    <div className="text-sm font-medium text-gray-500">
                      {headers[0]}
                    </div>
                    <div>{currentRow[0]}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Section */}
            {/*  WOULD BE ARRAY
                [
                  // First range: 3-11
                  ...Array.from({ length: 9 }, (_, i) => i + 3),
                  // Individual indices: 13, 14
                  13, 14, 15,
                  // Final range: 16-30
                  ...Array.from({ length: 13 }, (_, i) => i + 17)
                ]
                */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                {
                [11]
                .map((index) => (
                  currentRow[index] && (
                    <div key={index} className="border p-2 rounded">
                      <div className="text-sm font-medium text-gray-500">
                        {headers[index]}
                      </div>
                      <div className="mt-1">
                        {parseAndFormatCell(currentRow[index])}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
            {/* Scores Section - moved here
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Scores</h3>
              <div className="grid grid-cols-2 gap-4">
                {currentRow.slice(1, 5).map((cell, index) => ( //THIS IS WHAT SCORES GET DISPLAYED
                  cell && (
                    <div key={index} className="border p-2 rounded">
                      <div className="text-sm font-medium text-gray-500">
                        {headers[index + 1] || `Column ${index + 2}`}
                      </div>
                      <div>{cell}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
            */}

            {/* Selection Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Selection</h3>
              <div className="space-y-4">
                {/* Score input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Score</label>
                  <Textarea
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter your score here... please type only the number."
                    className="min-h-[100px]"
                  />
                </div>
                {/* Output selection */}
                {/*
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Output</label>
                  <Select
                    value={SMEOutput}
                    onValueChange={setSMEOutput}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an output" />
                    </SelectTrigger>
                    <SelectContent>
                      {outputColumns.map((output, index) => (
                        output && <SelectItem key={index} value={output}>
                          {output}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                */}

                {/* Response input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Response</label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Enter your response here... Please avoid using the first person and explain why you chose the output you did and why the profile deserves the score they received based on the profile and campaign"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button
                onClick={handlePrevious}
                disabled={currentRowIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAndExit}
              >
                Save & Exit
              </Button>
              <Button
                onClick={handleNext}
              >
                {currentRowIndex === rows.length - 1 ? 'Complete Review' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
