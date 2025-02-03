'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as Papa from 'papaparse';

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface CustomParseResult<T> {
  data: T[];
  errors: { message: string, row: number }[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    fields: string[] | null;
    truncated: boolean;
    cursor: number;
  };
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

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      Papa.parse(file, {
        complete: (results: CustomParseResult<string[]>) => {
          console.log("Parsed results:", results);

          if (results.errors.length > 0) {
            setError("Error parsing CSV file: " + results.errors[0].message);
            return;
          }

          if (results.data.length < 2) {
            setError("CSV file must contain headers and at least one row of data");
            return;
          }

          // Separate headers and data
          const headers = results.data[0];
          const rows = results.data.slice(1);

          // Filter out empty rows
          const validRows = rows.filter(
            (row) => row.length > 0 && row.some((cell) => cell && cell.toString().trim().length > 0)
          );

          if (validRows.length === 0) {
            setError("No valid data found in CSV file");
            return;
          }

          const parsedData: ParsedData = {
            headers,
            rows: validRows,
          };

          console.log("Parsed data:", parsedData);

          // Store the structured data in localStorage
          localStorage.setItem("csvData", JSON.stringify(parsedData));

          setSuccess("File uploaded successfully!");

          setTimeout(() => {
            router.push("/review");
          }, 500);
        },
        error: (error: unknown) => {
          console.error("Parse error:", error);
          if (error instanceof Error) {
            setError("Failed to parse CSV file: " + error.message);
          } else {
            setError("Failed to parse CSV file: Unknown error");
          }
        },
        delimiter: ",", // Explicitly set delimiter
        skipEmptyLines: "greedy", // Skip empty lines more aggressively
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Upload CSV File</h1>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="border-2 p-3 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 text-center">
              Maximum file size: 5MB. Only CSV files are accepted.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border border-red-500">
              <AlertTitle className="font-bold text-red-700">Error</AlertTitle>
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-300">
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file}
            className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Upload File
          </Button>
        </div>
      </div>
    </div>
  )
}
