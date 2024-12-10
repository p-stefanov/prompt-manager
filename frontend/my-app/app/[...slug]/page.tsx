"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PromptCaller({ params }: { params: { slug: string[] } }) {
  // State to manage text input
  const [inputText, setInputText] = useState('');

  // State to manage API response
  const [apiResponse, setApiResponse] = useState('');

  // State to manage loading status
  const [isLoading, setIsLoading] = useState(false);

  // State to manage any errors
  const [error, setError] = useState('');

  // Handle text area input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset previous states
    setApiResponse('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/${params.slug.join('/')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: inputText
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.text();
      setApiResponse(data || 'No result returned');
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>/{params.slug.join('/')}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder="Enter your JSON here..."
              className="min-h-[150px]"
            />

            <Button
              type="submit"
              disabled={!inputText || isLoading}
              className="w-full"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {apiResponse && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">API Response</CardTitle>
                </CardHeader>
                <CardContent>
                  {apiResponse}
                </CardContent>
              </Card>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
