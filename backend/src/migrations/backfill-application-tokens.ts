import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobPosting, JobPostingDocument } from '../modules/job-postings/entities/job-posting.entity';
import * as crypto from 'crypto';

/**
 * Migration script to backfill applicationToken for existing job postings
 * Run with: npm run migration:backfill-tokens
 */
async function backfillApplicationTokens() {
  const app = await NestFactory.createApplicationContext(AppModule);
  let hadFailures = false;
  
  try {
    const jobPostingModel = app.get<Model<JobPostingDocument>>('JobPostingModel');
    
    // Find all job postings without applicationToken
    const jobPostingsWithoutToken = await jobPostingModel.find({
      $or: [
        { applicationToken: { $exists: false } },
        { applicationToken: null },
        { applicationToken: '' }
      ]
    }).exec();
    
    console.log(`Found ${jobPostingsWithoutToken.length} job postings without applicationToken`);
    
    if (jobPostingsWithoutToken.length === 0) {
      console.log('✅ All job postings already have applicationToken. No migration needed.');
      await app.close();
      return;
    }
    
    let updated = 0;
    let failed = 0;
    
    for (const jobPosting of jobPostingsWithoutToken) {
      try {
        // Generate unique token
        let token = crypto.randomBytes(16).toString('hex');
        
        // Ensure uniqueness
        let existingToken = await jobPostingModel.findOne({ applicationToken: token }).exec();
        while (existingToken) {
          token = crypto.randomBytes(16).toString('hex');
          existingToken = await jobPostingModel.findOne({ applicationToken: token }).exec();
        }
        
        // Update the job posting
        jobPosting.applicationToken = token;
        await jobPosting.save();
        
        updated++;
        console.log(`✅ Updated job posting: ${jobPosting._id} - Token: ${token}`);
      } catch (error) {
        failed++;
        hadFailures = true;
        console.error(`❌ Failed to update job posting ${jobPosting._id}:`, error.message);
      }
    }
    
    console.log('\n========================================');
    console.log('Migration Complete!');
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('========================================\n');
    
    // Fail if any updates failed
    if (hadFailures) {
      throw new Error(`Migration completed with ${failed} failures`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error; // Re-throw to propagate failure
  } finally {
    await app.close();
  }
}

backfillApplicationTokens()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
