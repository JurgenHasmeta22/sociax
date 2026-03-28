import { Lock } from "lucide-react";

export const metadata = { title: "Privacy Policy · Sociax" };

export default function PrivacyPage() {
	return (
		<div className="max-w-3xl mx-auto py-10 px-4">
			<div className="flex items-center gap-3 mb-8">
				<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
					<Lock className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Privacy Policy</h1>
					<p className="text-muted-foreground text-sm">
						Last updated: March 2026
					</p>
				</div>
			</div>

			<div className="space-y-6">
				{[
					{
						title: "1. Information We Collect",
						content:
							"We collect information you provide directly, such as your name, email, profile details, posts, and messages. We also collect usage data like pages visited and interactions to improve your experience.",
					},
					{
						title: "2. How We Use Your Information",
						content:
							"Your information is used to provide and personalize the Sociax platform, including showing relevant content in your feed, connecting you with friends, and sending notifications about activity on your account.",
					},
					{
						title: "3. Information Sharing",
						content:
							"We do not sell your personal information to third parties. We may share anonymized, aggregated data for analytics purposes. Your public posts are visible to other users based on your privacy settings.",
					},
					{
						title: "4. Data Security",
						content:
							"We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits.",
					},
					{
						title: "5. Your Rights",
						content:
							"You have the right to access, correct, or delete your personal data at any time through your account settings. You can also request a copy of all data we hold about you.",
					},
					{
						title: "6. Cookies & Tracking",
						content:
							"We use essential cookies to keep you logged in and remember your preferences. We do not use third-party tracking cookies for advertising purposes.",
					},
					{
						title: "7. Children's Privacy",
						content:
							"Sociax is not intended for users under 13 years of age. We do not knowingly collect personal information from children.",
					},
					{
						title: "8. Changes to This Policy",
						content:
							"We may update this privacy policy from time to time. We will notify you of significant changes through the platform or via email.",
					},
				].map((section) => (
					<section
						key={section.title}
						className="rounded-xl bg-muted/50 border p-6"
					>
						<h2 className="text-lg font-semibold mb-2">
							{section.title}
						</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{section.content}
						</p>
					</section>
				))}

				<p className="text-center text-sm text-muted-foreground pt-4">
					If you have questions about this policy, contact us at
					support@sociax.com
				</p>
			</div>
		</div>
	);
}
