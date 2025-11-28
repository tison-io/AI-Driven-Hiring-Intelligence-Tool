import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from './entities/candidate.entity';
import { CandidateFilterDto } from './dto/candidate-filter.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(Candidate.name)
    private candidateModel: Model<CandidateDocument>,
  ) {}

  async findAll(filters: CandidateFilterDto): Promise<Candidate[]> {
    const query: any = {};

    if (filters.skill) {
      query.skills = { $regex: filters.skill, $options: 'i' };
    }

    if (filters.experience_min !== undefined || filters.experience_max !== undefined) {
      query.experienceYears = {};
      if (filters.experience_min !== undefined) {
        query.experienceYears.$gte = filters.experience_min;
      }
      if (filters.experience_max !== undefined) {
        query.experienceYears.$lte = filters.experience_max;
      }
    }

    if (filters.score_min !== undefined || filters.score_max !== undefined) {
      query.roleFitScore = {};
      if (filters.score_min !== undefined) {
        query.roleFitScore.$gte = filters.score_min;
      }
      if (filters.score_max !== undefined) {
        query.roleFitScore.$lte = filters.score_max;
      }
    }

    if (filters.jobRole) {
      query.jobRole = { $regex: filters.jobRole, $options: 'i' };
    }

    return this.candidateModel.find(query).exec();
  }

  async findById(id: string): Promise<CandidateDocument | null> {
    return this.candidateModel.findById(id).exec();
  }

  async create(candidateData: Partial<Candidate>): Promise<Candidate> {
    const candidate = new this.candidateModel(candidateData);
    return candidate.save();
  }

  async update(id: string, updateData: Partial<Candidate>): Promise<Candidate | null> {
    return this.candidateModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}