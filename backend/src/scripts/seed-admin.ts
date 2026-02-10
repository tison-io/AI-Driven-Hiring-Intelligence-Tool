import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  if(!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment variables.');
  }

  try {
    // Check if admin already exists
    const existingAdmin = await usersService.findByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await app.close();
      return;
    }

    // Create admin user
    await usersService.createAdmin(adminEmail, adminPassword);
    console.log('Admin user created successfully');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }

  await app.close();
}

seedAdmin();