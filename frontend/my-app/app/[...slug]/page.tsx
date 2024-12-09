"use client"; // This is a client component

import React, { useState } from 'react';

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
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
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
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h1 className="text-2xl font-bold text-gray-800">/{params.slug.join('/')}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Enter your JSON here..."
            className="w-full min-h-[150px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button 
            type="submit" 
            disabled={!inputText || isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}

          {apiResponse && (
            <div className="mt-4 bg-gray-50 border rounded-md p-4">
              <h2 className="text-lg font-semibold mb-2">API Response</h2>
              <div className="bg-white p-3 border rounded">
                <p>{apiResponse}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
