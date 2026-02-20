import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersService } from "./users.service";
import { User, UserSchema } from "./entities/user.entity";
import {
	VerificationCode,
	VerificationCodeSchema,
} from "../auth/entities/verification-code.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: VerificationCode.name, schema: VerificationCodeSchema },
		]),
		NotificationsModule,
	],
	providers: [UsersService],
	exports: [UsersService, MongooseModule],
})
export class UsersModule {}
