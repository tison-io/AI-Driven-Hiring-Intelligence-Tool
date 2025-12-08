import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from '../candidates/entities/candidate.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Candidate.name)
    private candidateModel: Model<CandidateDocument>,
  ) {}

  async getDashboardMetrics(userId: string, userRole: string) {
    const query = userRole === 'admin' ? {} : { createdBy: userId };
    
    const totalCandidates = await this.candidateModel.countDocuments(query);
    
    const completedCandidates = await this.candidateModel.find({ 
      ...query,
      status: 'completed',
      roleFitScore: { $exists: true, $ne: null }
    });

    const averageRoleFitScore = completedCandidates.length > 0
      ? completedCandidates.reduce((sum, candidate) => sum + (candidate.roleFitScore || 0), 0) / completedCandidates.length
      : 0;

    const shortlistCount = await this.candidateModel.countDocuments({
      ...query,
      roleFitScore: { $gte: 80 }
    });

    const processingCount = await this.candidateModel.countDocuments({
      ...query,
      status: { $in: ['pending', 'processing'] }
    });

    const recentCandidates = await this.candidateModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name jobRole roleFitScore status createdAt')
      .exec();

    return {
      totalCandidates,
      averageRoleFitScore: Math.round(averageRoleFitScore * 100) / 100,
      shortlistCount,
      processingCount,
      recentCandidates,
    };
  }

  async getScoreDistribution() {
    const candidates = await this.candidateModel.find({
      roleFitScore: { $exists: true, $ne: null }
    }).select('roleFitScore');

    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    candidates.forEach(candidate => {
      const score = candidate.roleFitScore || 0;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return distribution;
  }
}