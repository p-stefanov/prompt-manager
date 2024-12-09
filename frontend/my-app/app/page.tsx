"use client"; // This is a client component

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Save, X, Plus } from 'lucide-react';

// Prompt Interface
interface Prompt {
  path: string;
  system_message: string;
  user_message: string;
}

// Main Prompt Manager Component
export default function PromptManager() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState<Prompt>({
    path: '',
    system_message: '',
    user_message: ''
  });
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);

  // Fetch prompts from API
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('http://localhost:8000', {
          headers: {
            'Content-Type': 'application/json'}
        });
        const data = await response.json();
        setPrompts(data);
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      }
    };

    fetchPrompts();
  }, []);

  // Create new prompt
  const createPrompt = async () => {
    // Validate input
    if (!newPrompt.path) {
      alert('Please provide an endpoint for the prompt!');
      return;
    }
    if (newPrompt.path.startsWith('/')) {
      alert("Don't start with the leading / when registering a prompt!")
      return;
    }
    if (!/^[a-zA-Z0-9\._/-]+$/.test(newPrompt.path)) {
      alert('Invalid endpoint path!')
      return;
    }
    if (!newPrompt.user_message) {
      alert('Please provide a user message for the prompt!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/${newPrompt.path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrompt),
      });

      if (response.ok) {
        const createdPrompt = await response.json();
        setPrompts([...prompts, newPrompt]);

        // Reset new prompt form
        setNewPrompt({ path: '', system_message: '', user_message: '' });
        setIsCreatingPrompt(false);
      }
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  // Handle prompt edit
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
  };

  // Update prompt via API
  const updatePrompt = async () => {
    if (!editingPrompt) return;

    try {
      const response = await fetch(`http://localhost:8000/${editingPrompt.path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPrompt),
      });

      if (response.ok) {
        setPrompts(prompts.map(p =>
          p.path === editingPrompt.path ? editingPrompt : p
        ));
        setEditingPrompt(null);
      }
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  // Delete prompt via API
  const deletePrompt = async (path?: string) => {
    if (!path) return;

    try {
      const response = await fetch(`http://localhost:8000/${path}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrompts(prompts.filter(p => p.path !== path));
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prompt Manager</h1>
        <button
          onClick={() => setIsCreatingPrompt(true)}
          className="bg-green-500 text-white p-2 rounded flex items-center"
        >
          <Plus className="mr-2" size={16} /> Add Prompt
        </button>
      </div>

      {/* New Prompt Creation Form */}
      {isCreatingPrompt && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
          <input
            value={newPrompt.path}
            onChange={(e) => setNewPrompt({...newPrompt, path: e.target.value})}
            className="w-full mb-2 p-2 border rounded"
            placeholder="Endpoint"
          />
          <textarea
            value={newPrompt.system_message || ''}
            onChange={(e) => setNewPrompt({...newPrompt, system_message: e.target.value})}
            className="w-full mb-2 p-2 border rounded h-32 resize-y"
            placeholder="System Message Template"
          />
          <textarea
            value={newPrompt.user_message}
            onChange={(e) => setNewPrompt({...newPrompt, user_message: e.target.value})}
            className="w-full mb-2 p-2 border rounded h-32 resize-y"
            placeholder="User Message Template"
          />
          <div className="flex space-x-2">
            <button
              onClick={createPrompt}
              className="bg-green-500 text-white p-2 rounded flex items-center"
            >
              <Save className="mr-2" size={16} /> Save
            </button>
            <button
              onClick={() => {
                setIsCreatingPrompt(false);
                setNewPrompt({ path: '', system_message: '', user_message: '' });
              }}
              className="bg-gray-300 text-black p-2 rounded flex items-center"
            >
              <X className="mr-2" size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <div
            key={prompt.path}
            className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
          >
            {editingPrompt?.path === prompt.path ? (
              // Edit Mode
              <div className="w-full">
                <input
                  disabled
                  value={editingPrompt.path}
                  className="w-full mb-2 p-2 border rounded"
                />
                <textarea
                  value={editingPrompt.system_message || ''}
                  onChange={(e) => setEditingPrompt({...editingPrompt, system_message: e.target.value})}
                  className="w-full mb-2 p-2 border rounded h-32 resize-y"
                  placeholder="System Message Template"
                />
                <textarea
                  value={editingPrompt.user_message}
                  onChange={(e) => setEditingPrompt({...editingPrompt, user_message: e.target.value})}
                  className="w-full mb-2 p-2 border rounded h-32 resize-y"
                  placeholder="User Message Template"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={updatePrompt}
                    className="bg-green-500 text-white p-2 rounded flex items-center"
                  >
                    <Save className="mr-2" size={16} /> Save
                  </button>
                  <button
                    onClick={() => setEditingPrompt(null)}
                    className="bg-gray-300 text-black p-2 rounded flex items-center"
                  >
                    <X className="mr-2" size={16} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex-grow">
                <a href={`/${prompt.path}`}>{prompt.path}</a>
              </div>
            )}

            {/* Action Buttons */}
            {editingPrompt?.path !== prompt.path && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(prompt)}
                  className="text-blue-500 hover:bg-blue-100 p-2 rounded"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => deletePrompt(prompt.path)}
                  className="text-red-500 hover:bg-red-100 p-2 rounded"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
