import { ScrollText } from "lucide-react";

export const metadata = { title: "Terms of Service · Sociax" };

export default function TermsPage() {
	return (
		<div className="max-w-3xl mx-auto py-10 px-4">
			<div className="flex items-center gap-3 mb-8">
				<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
					<ScrollText className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Terms of Service</h1>
					<p className="text-muted-foreground text-sm">
						Last updated: March 2026
					</p>
				</div>
			</div>

			<div className="space-y-6">
				{[
					{
						title: "1. Acceptance of Terms",
						content:
							"By creating an account or using Sociax, you agree to these Terms of Service. If you do not agree, please do not use the platform.",
					},
					{
						title: "2. Account Responsibilities",
						content:
							"You are responsible for maintaining the security of your account. You must provide accurate information and keep your password confidential. You must be at least 13 years old to use Sociax.",
					},
					{
						title: "3. Content Guidelines",
						content:
							"You retain ownership of content you post. By posting, you grant Sociax a license to display it on the platform. Content must not be illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.",
					},
					{
						title: "4. Prohibited Activities",
						content:
							"You may not use Sociax for spam, harassment, phishing, spreading malware, impersonation, or any illegal activity. Automated access or scraping without permission is prohibited.",
					},
					{
						title: "5. Intellectual Property",
						content:
							"The Sociax platform, including its design, features, and branding, is protected by intellectual property laws. You may not copy, modify, or distribute our platform without permission.",
					},
					{
						title: "6. Marketplace Terms",
						content:
							"Marketplace transactions are between buyers and sellers. Sociax is not responsible for the quality, safety, or legality of items listed. All sales should comply with local laws and regulations.",
					},
					{
						title: "7. Termination",
						content:
							"We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your settings.",
					},
					{
						title: "8. Limitation of Liability",
						content:
							'Sociax is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.',
					},
					{
						title: "9. Governing Law",
						content:
							"These terms are governed by applicable laws. Any disputes shall be resolved through binding arbitration.",
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
					By continuing to use Sociax, you acknowledge that you have
					read and agree to these terms.
				</p>
			</div>
		</div>
	);
}
