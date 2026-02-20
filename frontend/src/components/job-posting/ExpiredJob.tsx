"use client";

import Link from "next/link";
import { TbHourglassOff } from "react-icons/tb";

export default function JobExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-md w-full">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <TbHourglassOff className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
          This position is no longer accepting applications
        </h1>

        {/* Subtitle */}
        {/* TODO: Needs to be updated to take the job that it is attached to */}
        <p className="text-gray-500 text-sm sm:text-base mb-8 leading-relaxed">
          The hiring team at TechStar Recruiters has closed the application
          window for the Senior Backend Engineer role.
        </p>

        {/* Button */}
        {/* Feature issue: This button seems to be out of place if the public posting will be via the link that the users will be accessing via the various social platforms */}
        <Link
          href="/job-posting"
          className="inline-block px-6 py-3 rounded-lg text-white font-medium 
          bg-gradient-to-r from-teal-500 to-purple-600 
          hover:opacity-90 transition duration-200 shadow-md"
        >
          Explore Other Openings
        </Link>
      </div>
    </div>
  );
}
