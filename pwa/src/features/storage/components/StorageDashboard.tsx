import React from 'react';
import { useAppStore } from '../../../stores/appStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/card';
import { HardDrive, Globe, Database, Pin, Plus, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';

export const StorageDashboard: React.FC = () => {
  const { storage, network } = useAppStore();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Storage Sovereignty</h1>
        <p className="text-muted-foreground">Manage where your data lives across the distributed network.</p>
      </header>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StorageOverviewCard
          title="Local Cache"
          description="Instant offline access"
          icon={<HardDrive className="w-5 h-5 text-blue-500" />}
          used={formatBytes(storage.localUsed)}
          capacity={formatBytes(storage.localCapacity)}
          percent={(storage.localUsed / storage.localCapacity) * 100}
          status="online"
        />
        <StorageOverviewCard
          title="IPFS Network"
          description="Public distributed storage"
          icon={<Globe className="w-5 h-5 text-purple-500" />}
          used={formatBytes(storage.ipfsPinned * 1024 * 1024)} // Mock size
          items={`${storage.ipfsPins.length} pins`}
          status={network.status}
        />
        <StorageOverviewCard
          title="Permanent DAG"
          description="Filecoin / Arweave deals"
          icon={<Database className="w-5 h-5 text-green-500" />}
          used={formatBytes(storage.totalDealStorage)}
          items={`${storage.activeDeals} deals`}
          status="active"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pin Manager */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>IPFS Pin Manager</CardTitle>
              <CardDescription>Content IDs pinned to the global distributed network.</CardDescription>
            </div>
            <Badge variant="secondary">{storage.ipfsPins.length} Items</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storage.ipfsPins.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  <Pin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No content pinned yet.</p>
                </div>
              ) : (
                storage.ipfsPins.map(cid => (
                  <div key={cid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-background rounded-md border">
                        <Pin className="w-4 h-4 text-purple-500" />
                      </div>
                      <code className="text-xs truncate font-mono">{cid}</code>
                    </div>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group">
                New Storage Deal <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                Export All Data <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                Verify Integrity <ShieldCheck className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Default Visibility</span>
                <Badge variant="outline" className="capitalize">{storage.defaultVisibility}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto-Pin Threshold</span>
                <span>{storage.autoPinThreshold} likes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface OverviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  used: string;
  capacity?: string;
  items?: string;
  percent?: number;
  status: string;
}

const StorageOverviewCard = ({ title, description, icon, used, capacity, items, percent, status }: OverviewCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-muted rounded-lg border shadow-sm">
          {icon}
        </div>
        <Badge variant={status === 'online' || status === 'connected' || status === 'active' ? 'default' : 'secondary'} className="capitalize bg-opacity-10 text-opacity-100 border-none">
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'online' || status === 'connected' || status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {status}
        </Badge>
      </div>
      <div className="space-y-1 mb-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span>{used}</span>
          <span className="text-muted-foreground">{capacity || items}</span>
        </div>
        {percent !== undefined && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all" 
              style={{ width: `${Math.min(100, percent)}%` }} 
            />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
