import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Key, Eye, EyeOff, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VaultSecret {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface VaultManagerProps {
  onSecretUpdate?: () => void;
}

const VaultManager: React.FC<VaultManagerProps> = ({ onSecretUpdate }) => {
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [newSecretDescription, setNewSecretDescription] = useState('');
  const [showSecretValues, setShowSecretValues] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      setLoading(true);

      // Get list of secrets (without actual values for security)
      const { data, error } = await supabase
        .from('vault.secrets')
        .select('id, name, description, created_at, updated_at')
        .order('name');

      if (error) {
        console.error('Error loading secrets:', error);
        // For demo purposes, show mock data if table doesn't exist
        setSecrets([
          {
            id: 1,
            name: 'GOOGLE_PRIVATE_KEY',
            description: 'Google Cloud Service Account Private Key',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'GOOGLE_CLIENT_ID',
            description: 'Google OAuth Client ID',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 3,
            name: 'GOOGLE_CLIENT_SECRET',
            description: 'Google OAuth Client Secret',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 4,
            name: 'VERTEX_AI_PROJECT_ID',
            description: 'Google Cloud Project ID for Vertex AI',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      } else {
        setSecrets(data || []);
      }

    } catch (error) {
      console.error('Error loading vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSecret = async () => {
    if (!newSecretName || !newSecretValue) return;

    try {
      // In a real implementation, this would call a secure RPC function
      // For demo purposes, we'll simulate adding a secret
      const newSecret: VaultSecret = {
        id: Date.now(),
        name: newSecretName,
        description: newSecretDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSecrets(prev => [...prev, newSecret]);
      setNewSecretName('');
      setNewSecretValue('');
      setNewSecretDescription('');
      setIsDialogOpen(false);

      onSecretUpdate?.();

    } catch (error) {
      console.error('Error adding secret:', error);
    }
  };

  const toggleSecretVisibility = (secretName: string) => {
    setShowSecretValues(prev => ({
      ...prev,
      [secretName]: !prev[secretName]
    }));
  };

  const getSecretDisplayValue = (secretName: string) => {
    // Mock secret values for demo
    const mockValues: Record<string, string> = {
      'GOOGLE_PRIVATE_KEY': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
      'GOOGLE_CLIENT_ID': '123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
      'GOOGLE_CLIENT_SECRET': 'GOCSPX-****************************',
      'VERTEX_AI_PROJECT_ID': 'adgenxai-demo-project'
    };

    return mockValues[secretName] || '••••••••••••••••••••••••••••••••';
  };

  const getSecretStatus = (secretName: string) => {
    const criticalSecrets = ['GOOGLE_PRIVATE_KEY', 'GOOGLE_CLIENT_ID', 'VERTEX_AI_PROJECT_ID'];
    return criticalSecrets.includes(secretName) ? 'critical' : 'standard';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-md border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-voyageur-gold" />
              Supabase Vault Manager
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSecrets}
                disabled={loading}
                className="bg-white/5 border-white/10 hover:border-voyageur-gold/50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-voyageur-gold hover:bg-yellow-600 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Secret
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Add New Secret</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="secret-name">Secret Name</Label>
                      <Input
                        id="secret-name"
                        value={newSecretName}
                        onChange={(e) => setNewSecretName(e.target.value)}
                        placeholder="e.g., GOOGLE_PRIVATE_KEY"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secret-value">Secret Value</Label>
                      <Input
                        id="secret-value"
                        type="password"
                        value={newSecretValue}
                        onChange={(e) => setNewSecretValue(e.target.value)}
                        placeholder="Enter the secret value"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secret-description">Description (Optional)</Label>
                      <Input
                        id="secret-description"
                        value={newSecretDescription}
                        onChange={(e) => setNewSecretDescription(e.target.value)}
                        placeholder="What is this secret used for?"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <Button onClick={addSecret} className="w-full">
                      Add Secret
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-voyageur-gold mb-3 uppercase tracking-wide">
                Stored Secrets ({secrets.length})
              </h4>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {secrets.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No secrets stored yet</p>
                      <p className="text-sm mt-2">Add your first secret to get started</p>
                    </div>
                  ) : (
                    secrets.map((secret) => (
                      <div key={secret.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-voyageur-gold" />
                            <span className="font-medium text-sm">{secret.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                getSecretStatus(secret.name) === 'critical'
                                  ? 'text-red-400 border-red-500/30'
                                  : 'text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {getSecretStatus(secret.name) === 'critical' && (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              )}
                              {getSecretStatus(secret.name)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSecretVisibility(secret.name)}
                            className="text-white/60 hover:text-white"
                          >
                            {showSecretValues[secret.name] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {secret.description && (
                          <p className="text-xs text-white/60 mb-2">{secret.description}</p>
                        )}

                        <div className="bg-black/40 rounded p-3 font-mono text-xs">
                          {showSecretValues[secret.name] ? (
                            <pre className="text-green-400 whitespace-pre-wrap break-all">
                              {getSecretDisplayValue(secret.name)}
                            </pre>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/10 rounded h-4"></div>
                              <span className="text-white/40">Click to reveal</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-3 text-xs text-white/40">
                          <span>Created: {new Date(secret.created_at).toLocaleDateString()}</span>
                          <span>Updated: {new Date(secret.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaultManager;