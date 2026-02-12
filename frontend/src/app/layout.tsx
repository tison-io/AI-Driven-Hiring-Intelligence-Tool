import { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Hiring Intelligence Tool",
	description: "AI-Driven Hiring Intelligence Platform",
	icons: {
		icon: '/images/logo.png',
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<AuthProvider>
					<NotificationProvider>
						{children}
					</NotificationProvider>
				</AuthProvider>
				<Toaster 
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							borderRadius: '8px',
							background: '#fff',
							color: '#374151',
							fontSize: '14px',
							fontWeight: '500',
							padding: '12px 16px',
							boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
							border: '1px solid #e5e7eb',
						},
					}}
				/>
			</body>
		</html>
	);
}
