const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up GameStore Backend...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created successfully');
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('\n📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory already exists');
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('\n📁 Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created');
} else {
  console.log('✅ Logs directory already exists');
}

console.log('\n🎉 Backend setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Make sure PostgreSQL is running on localhost:5432');
console.log('2. Create a database named "gameStoreDb"');
console.log('3. Update the .env file with your database credentials');
console.log('4. Run: npm run db:setup (to setup database tables)');
console.log('5. Run: npm run dev (to start the development server)');
console.log('\n🌐 The backend will run on http://localhost:5000'); 