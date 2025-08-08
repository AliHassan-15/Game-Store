const { execSync } = require('child_process');
const path = require('path');

console.log('🎮 Setting up GameStore Project...\n');

// Setup Backend
console.log('🔧 Setting up Backend...');
try {
  execSync('node setup.js', { stdio: 'inherit', cwd: path.join(__dirname, 'backend') });
  console.log('✅ Backend setup completed\n');
} catch (error) {
  console.error('❌ Backend setup failed:', error.message);
  process.exit(1);
}

// Setup Frontend
console.log('🔧 Setting up Frontend...');
try {
  execSync('node setup.js', { stdio: 'inherit', cwd: path.join(__dirname, 'frontend') });
  console.log('✅ Frontend setup completed\n');
} catch (error) {
  console.error('❌ Frontend setup failed:', error.message);
  process.exit(1);
}

console.log('🎉 GameStore Project setup completed successfully!');
console.log('\n📋 To run the project:');
console.log('\n1. Start the backend:');
console.log('   cd backend');
console.log('   npm run dev');
console.log('\n2. In a new terminal, start the frontend:');
console.log('   cd frontend');
console.log('   npm run dev');
console.log('\n🌐 Access the application:');
console.log('   Frontend: http://localhost:5173');
console.log('   Backend API: http://localhost:5000'); 