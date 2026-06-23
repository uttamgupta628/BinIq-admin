import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Wifi, WifiOff, RefreshCw, Server, Database } from "lucide-react";
import { buildApiUrl, API_CONFIG } from "../lib/api";

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
  database?: string;
}

export default function IntegrationStatus() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    try {
      const healthUrl = buildApiUrl('/health');
      console.log('IntegrationStatus: Checking health at:', healthUrl);
      console.log('IntegrationStatus: Using API base:', API_CONFIG.BASE_URL);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: HealthCheckResponse = await response.json();
        setHealthData(data);
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
        setHealthData(null);
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
      setHealthData(null);
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkBackendHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'online': return 'Backend Online';
      case 'offline': return 'Backend Offline';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Backend Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {backendStatus === 'online' ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">Backend API</span>
          </div>
          <Badge className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Health Data */}
        {healthData && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Environment:</span>
              <Badge variant="outline">{healthData.environment}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Database:
              </span>
              <Badge variant="outline" className="text-green-600">
                Connected
              </Badge>
            </div>
          </div>
        )}

        {/* Last Checked */}
        {lastChecked && (
          <div className="text-xs text-muted-foreground">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={checkBackendHealth}
          disabled={backendStatus === 'checking'}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
          {backendStatus === 'checking' ? 'Checking...' : 'Refresh Status'}
        </Button>

        {/* Integration Info */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="font-medium mb-1">Backend Integration</div>
          <div>Repository: binIQ-Backend</div>
          <div>Environment: {window.location.hostname}</div>
          <div>API Base: {API_CONFIG.BASE_URL}</div>
        </div>
      </CardContent>
    </Card>
  );
}
