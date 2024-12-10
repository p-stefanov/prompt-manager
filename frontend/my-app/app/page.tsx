"use client";

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Save, X, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import Link from "next/link";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  // Fetch prompts from API
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('http://localhost:8000', {
          headers: {
            'Content-Type': 'application/json'
          }
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
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prompt Manager</h1>
        <Button
          onClick={() => setIsCreatingPrompt(true)}
          className="flex items-center"
        >
          <Plus className="mr-2" size={16} /> Add Prompt
        </Button>
      </div>

      {/* New Prompt Creation Form */}
      {isCreatingPrompt && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <Input
              value={newPrompt.path}
              onChange={(e) => setNewPrompt({...newPrompt, path: e.target.value})}
              className="mb-2"
              placeholder="Endpoint"
            />
            <Textarea
              value={newPrompt.system_message || ''}
              onChange={(e) => setNewPrompt({...newPrompt, system_message: e.target.value})}
              className="mb-2 h-32"
              placeholder="System Message Template"
            />
            <Textarea
              value={newPrompt.user_message}
              onChange={(e) => setNewPrompt({...newPrompt, user_message: e.target.value})}
              className="mb-2 h-32"
              placeholder="User Message Template"
            />
            <div className="flex space-x-2">
              <Button
                onClick={createPrompt}
                className="flex items-center"
              >
                <Save className="mr-2" size={16} /> Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreatingPrompt(false);
                  setNewPrompt({ path: '', system_message: '', user_message: '' });
                }}
                className="flex items-center"
              >
                <X className="mr-2" size={16} /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.path}>
            <CardContent className="p-6 flex justify-between items-center">
              {editingPrompt?.path === prompt.path ? (
                // Edit Mode
                <div className="w-full">
                  <Input
                    disabled
                    value={editingPrompt.path}
                    className="mb-2"
                  />
                  <Textarea
                    value={editingPrompt.system_message || ''}
                    onChange={(e) => setEditingPrompt({...editingPrompt, system_message: e.target.value})}
                    className="mb-2 h-32"
                    placeholder="System Message Template"
                  />
                  <Textarea
                    value={editingPrompt.user_message}
                    onChange={(e) => setEditingPrompt({...editingPrompt, user_message: e.target.value})}
                    className="mb-2 h-32"
                    placeholder="User Message Template"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={updatePrompt}
                      className="flex items-center"
                    >
                      <Save className="mr-2" size={16} /> Save
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditingPrompt(null)}
                      className="flex items-center"
                    >
                      <X className="mr-2" size={16} /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex-grow">
                  <Link prefetch={false} href={`/${prompt.path}`} className="text-blue-600 hover:underline">
                    {prompt.path}
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              {editingPrompt?.path !== prompt.path && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit size={16} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setPromptToDelete(prompt.path);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the prompt "{prompt.path}".
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePrompt(promptToDelete!)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
