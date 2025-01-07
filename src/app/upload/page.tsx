'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Papa from 'papaparse'

interface ParsedData {
  headers: string[];
  rows: string[][];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const validateCSV = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return false
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB')
      return false
    }

    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)
    
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (validateCSV(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    try {
      Papa.parse(file, {
        complete: (results) => {
          console.log('Parsed results:', results)
          
          if (results.errors.length > 0) {
            setError('Error parsing CSV file: ' + results.errors[0].message)
            return
          }

          if (results.data.length < 2) { // Need at least headers and one data row
            setError('CSV file must contain headers and at least one row of data')
            return
          }

          // Separate headers and data
          const headers = results.data[0] as string[]
          const rows = results.data.slice(1) as string[][]

          // Filter out empty rows
          const validRows = rows.filter(row => 
            row.length > 0 && row.some(cell => cell && cell.toString().trim().length > 0)
          )

          if (validRows.length === 0) {
            setError('No valid data found in CSV file')
            return
          }

          const parsedData: ParsedData = {
            headers,
            rows: validRows
          }

          console.log('Parsed data:', parsedData)
          
          // Store the structured data in localStorage
          localStorage.setItem('csvData', JSON.stringify(parsedData))
          
          setSuccess('File uploaded successfully!')
          
          setTimeout(() => {
            router.push('/review')
          }, 500)
        },
        error: (error: any) => {
          console.error('Parse error:', error)
          setError('Failed to parse CSV file: ' + error.message)
        },
        delimiter: ",", // Explicitly set delimiter
        skipEmptyLines: 'greedy', // Skip empty lines more aggressively
      })
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file. Please try again.')
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">Upload CSV File</h1>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-500">
            Maximum file size: 5MB. Only CSV files are accepted.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file}
          className="w-full"
        >
          Upload File
        </Button>
      </div>
    </div>
  )
} 