#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 binIQ Admin Panel - Setup Verification\n');

// Check if backend directory exists
const backendExists = fs.existsSync('./backend');
console.log(`${backendExists ? '✅' : '❌'} Backend directory: ${backendExists ? 'Found' : 'Missing'}`);

// Check if backend package.json exists
const backendPackageExists = fs.existsSync('./backend/package.json');
console.log(`${backendPackageExists ? '✅' : '❌'} Backend package.json: ${backendPackageExists ? 'Found' : 'Missing'}`);

// Check if backend .env exists
const backendEnvExists = fs.existsSync('./backend/.env');
console.log(`${backendEnvExists ? '✅' : '❌'} Backend .env: ${backendEnvExists ? 'Found' : 'Missing'}`);

// Check if backend node_modules exists
const backendNodeModulesExists = fs.existsSync('./backend/node_modules');
console.log(`${backendNodeModulesExists ? '✅' : '❌'} Backend dependencies: ${backendNodeModulesExists ? 'Installed' : 'Not installed'}`);

// Check frontend dependencies
const frontendNodeModulesExists = fs.existsSync('./node_modules');
console.log(`${frontendNodeModulesExists ? '✅' : '❌'} Frontend dependencies: ${frontendNodeModulesExists ? 'Installed' : 'Not installed'}`);

// Check environment variable
const envSet = process.env.VITE_API_URL !== undefined;
console.log(`${envSet ? '✅' : '❌'} VITE_API_URL environment variable: ${envSet ? 'Set' : 'Not set'}`);

console.log('\n📋 Setup Status Summary:');

const allChecks = [
  backendExists,
  backendPackageExists,
  backendEnvExists,
  backendNodeModulesExists,
  frontendNodeModulesExists
];

const passed = allChecks.filter(Boolean).length;
const total = allChecks.length;

console.log(`${passed}/${total} checks passed`);

if (passed === total) {
  console.log('\n🎉 Setup Complete! You can now run:');
  console.log('   npm run dev:full    (Run both frontend and backend)');
  console.log('   npm run dev         (Frontend only)');
  console.log('   npm run dev:backend (Backend only)');
  console.log('\n🌐 Access Points:');
  console.log('   Frontend: http://localhost:5173');
  console.log('   Backend API: http://localhost:3001/api');
  console.log('   Health Check: http://localhost:3001/api/health');
  console.log('\n🔑 Default Admin Login:');
  console.log('   Email: admin@biniq.com');
  console.log('   Password: admin123');
  console.log('   (Run: cd backend && npm run init-db to create admin user)');
} else {
  console.log('\n⚠️  Setup Incomplete. Please run:');
  if (!frontendNodeModulesExists) {
    console.log('   npm install');
  }
  if (!backendNodeModulesExists) {
    console.log('   cd backend && npm install');
  }
  if (!backendEnvExists) {
    console.log('   Create backend/.env with your MongoDB credentials');
  }
}

console.log('\n📚 For detailed instructions, see README.md');
