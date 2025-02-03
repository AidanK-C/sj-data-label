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
  selectedOutput: string;
  response: string;
}

export default function ReviewPage() {
  const router = useRouter()
  const [currentRowIndex, setCurrentRowIndex] = useState(0)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [reviewedData, setReviewedData] = useState<ReviewData[]>([])
  const [selectedOutput, setSelectedOutput] = useState('')
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
      // Create headers string, including original headers plus our new columns
      const headerRow = [...headers, 'Selected Output', 'Response'].join(',')
      
      // Create CSV content from reviewed data
      const dataRows = reviewedData.map(review => {
        // Ensure all cells are properly escaped
        const escapedRowData = review.rowData.map(cell => {
          // If cell contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
          if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });

        // Escape the response and selected output if needed
        const escapedResponse = review.response.includes(',') || 
                              review.response.includes('"') || 
                              review.response.includes('\n')
          ? `"${review.response.replace(/"/g, '""')}"`
          : review.response;

        const escapedOutput = review.selectedOutput.includes(',') || 
                            review.selectedOutput.includes('"') || 
                            review.selectedOutput.includes('\n')
          ? `"${review.selectedOutput.replace(/"/g, '""')}"`
          : review.selectedOutput;

        // Combine all fields
        return [...escapedRowData, escapedOutput, escapedResponse].join(',');
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
      selectedOutput: selectedOutput || '',
      response: response || ''
    };
    setReviewedData(updatedReviewedData);
    localStorage.setItem('reviewedData', JSON.stringify(updatedReviewedData));
  };

  const loadReviewData = (index: number) => {
    const existingReview = reviewedData[index]
    if (existingReview) {
      setSelectedOutput(existingReview.selectedOutput)
      setResponse(existingReview.response)
    } else {
      setSelectedOutput('')
      setResponse('')
    }
  }

  const handleSaveAndExit = () => {
    // First save the current review
    saveCurrentReview()
    
    // Download the current progress
    try {
      // Create headers string, including original headers plus our new columns
      const headerRow = [...headers, 'Selected Output', 'Response'].join(',')
      
      // Create CSV content from reviewed data
      const dataRows = reviewedData.map(review => {
        // Ensure all cells are properly escaped
        const escapedRowData = review.rowData.map(cell => {
          // If cell contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
          if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });

        // Escape the response and selected output if needed
        const escapedResponse = review.response.includes(',') || 
                              review.response.includes('"') || 
                              review.response.includes('\n')
          ? `"${review.response.replace(/"/g, '""')}"`
          : review.response;

        const escapedOutput = review.selectedOutput.includes(',') || 
                            review.selectedOutput.includes('"') || 
                            review.selectedOutput.includes('\n')
          ? `"${review.selectedOutput.replace(/"/g, '""')}"`
          : review.selectedOutput;

        // Combine all fields
        return [...escapedRowData, escapedOutput, escapedResponse].join(',');
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

    // Finally, redirect to upload page
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
                {/* Only show the 7th indexed item */}
                {currentRow[7] && ( //CHANGE THIS TO BE THE CAMPAIGN
                  <div className="border p-2 rounded w-full">
                    <div className="text-sm font-medium text-gray-500">
                      {headers[7] || `Column 8`}
                    </div>
                    <div>{currentRow[7]}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                {currentRow.slice(8).map((cell, index) => (
                  cell && (
                    <div key={index} className="border p-2 rounded">
                      <div className="text-sm font-medium text-gray-500">
                        {headers[index + 8] || `Column ${index + 9}`}
                      </div>
                      <div>{cell}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Scores Section - moved here */}
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

            {/* Selection Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Selection</h3>
              <div className="space-y-4">
                {/* Score input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Score</label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Enter your score here... please type only the number."
                    className="min-h-[100px]"
                  />
                </div>
                {/* Output selection */}
                {/*
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Output</label>
                  <Select
                    value={selectedOutput}
                    onValueChange={setSelectedOutput}
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
                    placeholder="Enter your response here... Please avoid using the first person and explain why you chose the output you did and why the profile deserves the score they received based on the profile and campaign with respect to the other options"
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
