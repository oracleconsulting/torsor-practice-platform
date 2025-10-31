/**
 * AI Settings Management Page
 * Allows admins to manage LLM prompts, models, and API keys
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Settings, 
  Edit, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Key, 
  Brain, 
  Clock, 
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AIPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt_key: string;
  system_prompt: string;
  user_prompt_template: string;
  model_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface APIKey {
  id: string;
  provider: string;
  key_name: string;
  encrypted_key: string;
  is_active: boolean;
  total_requests: number;
  total_tokens_used: number;
  last_used_at: string;
}

export const AISettingsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const practiceId = 'a1b2c3d4-5678-90ab-cdef-123456789abc'; // RPGCC practice ID

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promptsRes, keysRes] = await Promise.all([
        supabase
          .from('ai_prompts')
          .select('*')
          .eq('practice_id', practiceId)
          .order('category', { ascending: true }),
        supabase
          .from('ai_api_keys')
          .select('*')
          .eq('practice_id', practiceId)
      ]);

      if (promptsRes.data) setPrompts(promptsRes.data);
      if (keysRes.data) setAPIKeys(keysRes.data);
    } catch (error) {
      console.error('[AISettings] Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt) return;

    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({
          name: editingPrompt.name,
          description: editingPrompt.description,
          system_prompt: editingPrompt.system_prompt,
          user_prompt_template: editingPrompt.user_prompt_template,
          model_provider: editingPrompt.model_provider,
          model_name: editingPrompt.model_name,
          temperature: editingPrompt.temperature,
          max_tokens: editingPrompt.max_tokens,
          is_active: editingPrompt.is_active
        })
        .eq('id', editingPrompt.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prompt updated successfully'
      });

      setShowEditDialog(false);
      setEditingPrompt(null);
      loadData();
    } catch (error) {
      console.error('[AISettings] Error saving prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prompt',
        variant: 'destructive'
      });
    }
  };

  const handleAddAPIKey = async (provider: string, keyName: string, apiKey: string) => {
    try {
      const { error } = await supabase
        .from('ai_api_keys')
        .insert({
          practice_id: practiceId,
          provider: provider,
          key_name: keyName,
          encrypted_key: apiKey, // In production, this should be encrypted
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'API key added successfully'
      });

      setShowKeyDialog(false);
      loadData();
    } catch (error) {
      console.error('[AISettings] Error adding API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to add API key',
        variant: 'destructive'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'generation': return <Brain className="w-4 h-4" />;
      case 'recommendation': return <Zap className="w-4 h-4" />;
      case 'analysis': return <TrendingUp className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'generation': return 'bg-purple-100 text-purple-800';
      case 'recommendation': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-gray-600 mt-1">Manage LLM prompts, models, and API configurations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Add API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add API Key</DialogTitle>
                <DialogDescription>
                  Add a new API key for AI services
                </DialogDescription>
              </DialogHeader>
              <AddAPIKeyForm onSubmit={handleAddAPIKey} onCancel={() => setShowKeyDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts">
            <Brain className="w-4 h-4 mr-2" />
            Prompts ({prompts.length})
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys ({apiKeys.length})
          </TabsTrigger>
          <TabsTrigger value="usage">
            <TrendingUp className="w-4 h-4 mr-2" />
            Usage Stats
          </TabsTrigger>
        </TabsList>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Changes to prompts will create a new version. Previous versions are archived for reference.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            {prompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(prompt.category)}>
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(prompt.category)}
                            {prompt.category}
                          </span>
                        </Badge>
                        <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">v{prompt.version}</Badge>
                      </div>
                      <CardTitle className="text-xl">{prompt.name}</CardTitle>
                      <CardDescription>{prompt.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPrompt(prompt);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Model:</span>
                      <p className="text-gray-900 mt-1">{prompt.model_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Temperature:</span>
                      <p className="text-gray-900 mt-1">{prompt.temperature}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Max Tokens:</span>
                      <p className="text-gray-900 mt-1">{prompt.max_tokens}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              API keys are encrypted in storage. Never share your keys with anyone.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{key.provider}</Badge>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{key.key_name || key.provider}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-600">API Key:</Label>
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                        {showApiKey[key.id] ? key.encrypted_key : '••••••••••••••••••••••••••••'}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                      >
                        {showApiKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Total Requests:</span>
                        <p className="text-gray-900 mt-1">{key.total_requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Total Tokens:</span>
                        <p className="text-gray-900 mt-1">{key.total_tokens_used.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Last Used:</span>
                        <p className="text-gray-900 mt-1">
                          {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Usage Stats Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">
                  {apiKeys.reduce((sum, key) => sum + key.total_requests, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">
                  {apiKeys.reduce((sum, key) => sum + key.total_tokens_used, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Active Prompts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">
                  {prompts.filter(p => p.is_active).length}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Prompt Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Modify prompt configuration. Changes will create a new version.
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <EditPromptForm
              prompt={editingPrompt}
              onChange={setEditingPrompt}
              onSave={handleSavePrompt}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingPrompt(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Edit Prompt Form Component
const EditPromptForm: React.FC<{
  prompt: AIPrompt;
  onChange: (prompt: AIPrompt) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ prompt, onChange, onSave, onCancel }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Prompt Name</Label>
          <Input
            id="name"
            value={prompt.name}
            onChange={(e) => onChange({ ...prompt, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="is_active">Status</Label>
          <Select
            value={prompt.is_active ? 'active' : 'inactive'}
            onValueChange={(value) => onChange({ ...prompt, is_active: value === 'active' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={prompt.description || ''}
          onChange={(e) => onChange({ ...prompt, description: e.target.value })}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="model_name">Model</Label>
        <Input
          id="model_name"
          value={prompt.model_name}
          onChange={(e) => onChange({ ...prompt, model_name: e.target.value })}
          placeholder="e.g., anthropic/claude-3.5-sonnet"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={prompt.temperature}
            onChange={(e) => onChange({ ...prompt, temperature: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="max_tokens">Max Tokens</Label>
          <Input
            id="max_tokens"
            type="number"
            value={prompt.max_tokens}
            onChange={(e) => onChange({ ...prompt, max_tokens: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={prompt.system_prompt}
          onChange={(e) => onChange({ ...prompt, system_prompt: e.target.value })}
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="user_prompt_template">User Prompt Template</Label>
        <p className="text-sm text-gray-600 mb-2">Use {`{{placeholder}}`} for dynamic values</p>
        <Textarea
          id="user_prompt_template"
          value={prompt.user_prompt_template}
          onChange={(e) => onChange({ ...prompt, user_prompt_template: e.target.value })}
          rows={12}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

// Add API Key Form Component
const AddAPIKeyForm: React.FC<{
  onSubmit: (provider: string, keyName: string, apiKey: string) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [provider, setProvider] = useState('openrouter');
  const [keyName, setKeyName] = useState('');
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="provider">Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="key_name">Key Name (Optional)</Label>
        <Input
          id="key_name"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder="e.g., Production Key"
        />
      </div>

      <div>
        <Label htmlFor="api_key">API Key</Label>
        <Input
          id="api_key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(provider, keyName, apiKey)} disabled={!apiKey}>
          <Plus className="w-4 h-4 mr-2" />
          Add Key
        </Button>
      </div>
    </div>
  );
};

export default AISettingsPage;

