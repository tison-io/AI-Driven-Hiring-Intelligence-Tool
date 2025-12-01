import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ApifyService } from "./linkedinScraper.service";
import { ApifyConfig } from "../../config/linkedinScraper.config";
import { LinkedInMapper } from "./mappers/linkedin-mapper";

@Module({
	imports: [HttpModule, ConfigModule],
	providers: [ApifyService, ApifyConfig, LinkedInMapper],
	exports: [ApifyService, LinkedInMapper],
})
export class ApifyModule {}
