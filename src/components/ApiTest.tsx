import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function ApiTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoint = async (url: string, label: string) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const status = response.status;
      const text = await response.text();
      setTestResults(prev => [...prev, `${label}: ${status} - ${text.substring(0, 100)}`]);
    } catch (error) {
      setTestResults(prev => [...prev, `${label}: ERROR - ${error.message}`]);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Test different endpoint variations
    await testEndpoint("https://api.biniq.net/", "Base URL");
    await testEndpoint("https://api.biniq.net/api", "Base URL + /api");
    await testEndpoint("https://api.biniq.net/health", "Health check");
    await testEndpoint("https://api.biniq.net/api/health", "Health check + /api");
    await testEndpoint("https://api.biniq.net/users", "Users endpoint");
    await testEndpoint("https://api.biniq.net/api/users", "Users endpoint + /api");
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Endpoint Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={isLoading}>
          {isLoading ? "Testing..." : "Test API Endpoints"}
        </Button>
        
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded text-sm font-mono">
              {result}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
