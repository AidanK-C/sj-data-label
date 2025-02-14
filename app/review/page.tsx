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

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type FormattedValue = string | React.ReactNode;

const parseAndFormatCell = (cell: string): React.ReactNode => {
  const formatValue = (value: JsonValue, depth: number = 0): FormattedValue => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div className={`space-y-0.5 ${depth > 0 ? 'mt-0.5' : ''}`}>
          {Object.entries(value).map(([nestedKey, nestedValue], i) => (
            <div 
              key={i} 
              className={`pl-1 border-l border-gray-200 ${depth > 0 ? 'ml-1' : ''}`}
            >
              <span className="text-xs font-medium text-gray-600">
                {nestedKey}:
              </span>{' '}
              <span className="text-xs">
                {formatValue(nestedValue, depth + 1)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  };

  try {
    if (cell?.trim().startsWith('{') || cell?.trim().startsWith('[')) {
      const parsed = JSON.parse(cell) as JsonValue;
      if (typeof parsed === 'object' && parsed !== null) {
        return formatValue(parsed);
      }
    }
    return cell;
  } catch {
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

      const fullCsvContent = headerRow + '\n' + dataRows;
      
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

      const fullCsvContent = headerRow + '\n' + dataRows;
      
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

  if (isComplete) {
    return (
      <div className="h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
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

  return (
    <div className="h-screen p-4 flex items-center justify-center">
      <Card className="w-full max-w-4xl max-h-screen overflow-auto">
        <CardHeader className="sticky top-0 bg-white z-10">
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
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Campaign</h3>
              {currentRow[0] && (
                <div className="border p-2 rounded">
                  <div className="text-xs font-medium text-gray-500">{headers[0]}</div>
                  <div className="text-sm">{currentRow[0]}</div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Profile</h3>
              <div className="grid grid-cols-1 gap-2">
                {[11].map((index) => (
                  currentRow[index] && (
                    <div key={index} className="border p-2 rounded">
                      <div className="text-xs font-medium text-gray-500">{headers[index]}</div>
                      <div className="text-sm">{parseAndFormatCell(currentRow[index])}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Selection</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium">Your Score</label>
                  <Textarea
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter your score here... please type only the number."
                    className="h-20 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Your Response</label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Enter your response here..."
                    className="h-20 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                onClick={handlePrevious}
                disabled={currentRowIndex === 0}
                size="sm"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAndExit}
                size="sm"
              >
                Exit
              </Button>
              <Button
                onClick={handleNext}
                size="sm"
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
