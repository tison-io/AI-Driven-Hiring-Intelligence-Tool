import { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Hiring Intelligence Tool",
	description: "AI-Driven Hiring Intelligence Platform",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<AuthProvider>{children}</AuthProvider>
				<Toaster position="top-right" />
			</body>
		</html>
	);
}
