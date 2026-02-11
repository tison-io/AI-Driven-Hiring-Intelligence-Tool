import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "./entities/user.entity";
import {
	VerificationCode,
	VerificationCodeDocument,
} from "../auth/entities/verification-code.entity";
import { RegisterDto } from "../auth/dto/register.dto";
import { CompleteProfileDto } from "../auth/dto/complete-profile.dto";
import { UserRole } from "../../common/enums/user-role.enum";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name)
		private userModel: Model<UserDocument>,
		@InjectModel(VerificationCode.name)
		private verificationCodeModel: Model<VerificationCodeDocument>,
	) {}

	async create(registerDto: RegisterDto): Promise<UserDocument> {
		const hashedPassword = await bcrypt.hash(registerDto.password, 10);

		const user = new this.userModel({
			...registerDto,
			password: hashedPassword,
			role: UserRole.RECRUITER,
		});

		return user.save();
	}

	async createAdmin(email: string, password: string): Promise<UserDocument> {
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new this.userModel({
			email,
			password: hashedPassword,
			role: UserRole.ADMIN,
			profileCompleted: true,
			emailVerified: true,
		});

		return user.save();
	}

	async findByEmail(email: string): Promise<UserDocument | null> {
		return this.userModel.findOne({ email }).exec();
	}

	async findById(id: string): Promise<UserDocument | null> {
		return this.userModel.findById(id).exec();
	}

	async updatePassword(id: string, hashedPassword: string): Promise<void> {
		await this.userModel
			.findByIdAndUpdate(id, { password: hashedPassword })
			.exec();
	}

	async updateProfile(
		id: string,
		updateData: Partial<User>,
	): Promise<UserDocument | null> {
		return this.userModel
			.findByIdAndUpdate(id, updateData, { new: true })
			.exec();
	}

	async completeProfile(
		id: string,
		profileData: CompleteProfileDto & {
			userPhoto?: string;
			companyLogo?: string;
		},
	): Promise<UserDocument | null> {
		return this.userModel
			.findByIdAndUpdate(
				id,
				{ ...profileData, profileCompleted: true },
				{ new: true },
			)
			.exec();
	}

	async delete(id: string): Promise<void> {
		await this.userModel.findByIdAndDelete(id).exec();
	}

	async setPasswordResetToken(
		email: string,
		hashedToken: string,
		expires: Date,
	): Promise<void> {
		await this.userModel
			.findOneAndUpdate(
				{ email },
				{
					passwordResetToken: hashedToken,
					passwordResetExpires: expires,
					passwordResetUsed: false,
					$inc: { passwordResetAttempts: 1 },
					lastPasswordResetRequest: new Date(),
				},
			)
			.exec();
	}

	async findByResetToken(hashedToken: string): Promise<UserDocument | null> {
		return this.userModel
			.findOne({
				passwordResetToken: hashedToken,
				passwordResetExpires: { $gt: new Date() },
				passwordResetUsed: false,
			})
			.exec();
	}

	async resetPassword(
		userId: string,
		hashedPassword: string,
		oldPasswordHash: string,
	): Promise<void> {
		await this.userModel
			.findByIdAndUpdate(userId, {
				password: hashedPassword,
				passwordResetToken: null,
				passwordResetExpires: null,
				passwordResetUsed: true,
				$push: {
					passwordHistory: { $each: [oldPasswordHash], $slice: -5 },
				},
			})
			.exec();
	}

	async canRequestReset(email: string): Promise<boolean> {
		const user = await this.userModel.findOne({ email }).exec();
		if (!user) return true;

		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		if (
			user.lastPasswordResetRequest &&
			user.lastPasswordResetRequest > oneHourAgo
		) {
			return user.passwordResetAttempts < 3;
		}

		await this.userModel
			.findByIdAndUpdate(user._id, { passwordResetAttempts: 0 })
			.exec();
		return true;
	}

	async createOAuthUser(oauthData: {
		email: string;
		password: string;
		fullName: string;
		userPhoto?: string;
		googleId: string;
		authProvider: string;
	}): Promise<UserDocument> {
		const user = new this.userModel({
			...oauthData,
			role: UserRole.RECRUITER,
			profileCompleted: false,
		});

		return user.save();
	}

	async createVerificationCode(
		userId: Types.ObjectId,
		email: string,
	): Promise<string> {
		const code = crypto.randomInt(100000, 1000000).toString();
		const codeHash = crypto.createHash("sha256").update(code).digest("hex");
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

		await this.deleteVerificationCodes(userId);

		await this.verificationCodeModel.create({
			userId,
			codeHash,
			expiresAt,
			attempts: 0,
		});

		return code;
	}

	async findVerificationCode(
		email: string,
	): Promise<VerificationCodeDocument | null> {
		const user = await this.findByEmail(email);
		if (!user) return null;

		return this.verificationCodeModel
			.findOne({
				userId: user._id,
				expiresAt: { $gt: new Date() },
			})
			.sort({ createdAt: -1 })
			.exec();
	}

	async deleteVerificationCodes(userId: Types.ObjectId): Promise<void> {
		await this.verificationCodeModel.deleteMany({ userId }).exec();
	}

	async markEmailVerified(
		userId: Types.ObjectId,
	): Promise<UserDocument | null> {
		return this.userModel
			.findByIdAndUpdate(userId, { emailVerified: true }, { new: true })
			.exec();
	}

	async canRequestVerification(email: string): Promise<boolean> {
		const user = await this.findByEmail(email);
		if (!user) return true;

		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		const count = await this.verificationCodeModel
			.countDocuments({
				userId: user._id,
				createdAt: { $gte: oneHourAgo },
			})
			.exec();

		return count < 3;
	}

	async incrementVerificationAttempts(codeId: Types.ObjectId): Promise<void> {
		await this.verificationCodeModel
			.findByIdAndUpdate(codeId, { $inc: { attempts: 1 } })
			.exec();
	}
}
