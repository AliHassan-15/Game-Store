import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up GameStore Frontend...\n');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file...');
  const envContent = `# Frontend Environment Variables
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RsNh43lzt6TCA9wHWP94mFNWLDc1jNzYCuaesAUSEozPDddVt5mRJClipt8JoKf5qxYTu0su2W3ctYrvPTMyvE100gR2qgXdC
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🎉 Frontend setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Make sure the backend is running on http://localhost:5000');
console.log('2. Run: npm run dev (to start the development server)');
console.log('\n🌐 The frontend will run on http://localhost:5173'); 