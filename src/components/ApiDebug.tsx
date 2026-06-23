import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ApiDebug() {
  const [testResults, setTestResults] = useState<{
    healthCheck: 'pending' | 'success' | 'error';
    apiUrl: string;
    errorMessage?: string;
  }>({
    healthCheck: 'pending',
    apiUrl: ''
  });

  const testApiConnection = async () => {
    setTestResults({ healthCheck: 'pending', apiUrl: '' });
    
    try {
      // Test production API
      const prodUrl = "https://bin-iq-backend.vercel.app/api/health";
      console.log('Testing production API:', prodUrl);
      
      const response = await fetch(prodUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults({
          healthCheck: 'success',
          apiUrl: prodUrl,
        });
        console.log('API health check successful:', data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API test failed:', error);
      setTestResults({
        healthCheck: 'error',
        apiUrl: "https://bin-iq-backend.vercel.app/api/health",
        errorMessage: error.message
      });
    }
  };

  const getStatusIcon = () => {
    switch (testResults.healthCheck) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    switch (testResults.healthCheck) {
      case 'success':
        return <Badge className="bg-green-500 text-white">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          API Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">API Status:</span>
            {getStatusBadge()}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div>Current URL: {testResults.apiUrl || 'Not tested'}</div>
            <div>Environment: {window.location.hostname}</div>
          </div>
          
          {testResults.errorMessage && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Error: {testResults.errorMessage}
            </div>
          )}
        </div>

        <Button 
          onClick={testApiConnection}
          disabled={testResults.healthCheck === 'pending'}
          className="w-full"
        >
          {testResults.healthCheck === 'pending' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test API Connection'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
