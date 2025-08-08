'use client';

import { useState, useEffect } from 'react';
import { features, enableFeature, disableFeature, isFeatureEnabled } from '@/config/features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function FeatureFlagsPage() {
  const [mounted, setMounted] = useState(false);
  const [featureStates, setFeatureStates] = useState<typeof features | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load current feature states from localStorage after mount
    const loadedStates = { ...features };
    Object.keys(loadedStates).forEach((key) => {
      const featureName = key as keyof typeof features;
      loadedStates[featureName] = isFeatureEnabled(featureName);
    });
    setFeatureStates(loadedStates);
  }, []);

  const toggleFeature = (featureName: keyof typeof features) => {
    if (!featureStates) return;
    
    if (featureStates[featureName]) {
      disableFeature(featureName);
    } else {
      enableFeature(featureName);
    }
    
    // Update local state
    setFeatureStates(prev => prev ? { ...prev, [featureName]: !prev[featureName] } : null);
  };

  // Don't render switches until client-side to avoid hydration mismatch
  if (!mounted || !featureStates) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>Loading feature flags...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Enable or disable features for testing. Changes are temporary and only apply to this session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="threeColumnLayout">Three Column Layout</Label>
                <p className="text-sm text-muted-foreground">Story 1.1a - Basic layout structure</p>
              </div>
              <Switch
                id="threeColumnLayout"
                checked={featureStates.threeColumnLayout}
                onCheckedChange={() => toggleFeature('threeColumnLayout')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="catalystBranding">Catalyst X Branding</Label>
                <p className="text-sm text-muted-foreground">Story 1.1b - Visual identity</p>
              </div>
              <Switch
                id="catalystBranding"
                checked={featureStates.catalystBranding}
                onCheckedChange={() => toggleFeature('catalystBranding')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="glassMorphism">Glass Morphism</Label>
                <p className="text-sm text-muted-foreground">Story 1.1c - Visual effects</p>
              </div>
              <Switch
                id="glassMorphism"
                checked={featureStates.glassMorphism}
                onCheckedChange={() => toggleFeature('glassMorphism')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="animations">Animations</Label>
                <p className="text-sm text-muted-foreground">Story 1.1c - Motion effects</p>
              </div>
              <Switch
                id="animations"
                checked={featureStates.animations}
                onCheckedChange={() => toggleFeature('animations')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enhancedChat">Enhanced Chat</Label>
                <p className="text-sm text-muted-foreground">Story 1.2 - Structured workflows</p>
              </div>
              <Switch
                id="enhancedChat"
                checked={featureStates.enhancedChat}
                onCheckedChange={() => toggleFeature('enhancedChat')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="projectPersistence">Project Persistence</Label>
                <p className="text-sm text-muted-foreground">Story 1.7 - Save/load projects</p>
              </div>
              <Switch
                id="projectPersistence"
                checked={featureStates.projectPersistence}
                onCheckedChange={() => toggleFeature('projectPersistence')}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              After toggling features, refresh the <a href="/chat" className="underline">chat page</a> to see changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}