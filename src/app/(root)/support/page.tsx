import {
	HelpCircle,
	MessageSquare,
	FileText,
	Shield,
	AlertTriangle,
	Mail,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Support · Sociax" };

export default function SupportPage() {
	return (
		<div className="max-w-3xl mx-auto py-10 px-4">
			<div className="flex items-center gap-3 mb-8">
				<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
					<HelpCircle className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Support Center</h1>
					<p className="text-muted-foreground text-sm">
						We&apos;re here to help
					</p>
				</div>
			</div>

			{/* Quick links */}
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
				{[
					{
						icon: MessageSquare,
						title: "Account Help",
						desc: "Login issues, password reset, account settings",
						color: "text-blue-500 bg-blue-500/10",
					},
					{
						icon: Shield,
						title: "Privacy & Safety",
						desc: "Block users, report content, privacy controls",
						color: "text-green-500 bg-green-500/10",
					},
					{
						icon: AlertTriangle,
						title: "Report a Problem",
						desc: "Bugs, glitches, and technical issues",
						color: "text-amber-500 bg-amber-500/10",
					},
					{
						icon: FileText,
						title: "Content Policies",
						desc: "Community guidelines and content rules",
						color: "text-purple-500 bg-purple-500/10",
					},
					{
						icon: HelpCircle,
						title: "General FAQ",
						desc: "Common questions about using Sociax",
						color: "text-cyan-500 bg-cyan-500/10",
					},
					{
						icon: Mail,
						title: "Contact Us",
						desc: "Reach our support team directly",
						color: "text-rose-500 bg-rose-500/10",
					},
				].map((item) => (
					<Card
						key={item.title}
						className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
					>
						<CardContent className="pt-5 pb-5">
							<div
								className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}
							>
								<item.icon className="h-5 w-5" />
							</div>
							<h3 className="font-semibold mb-1">{item.title}</h3>
							<p className="text-sm text-muted-foreground">
								{item.desc}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* FAQ */}
			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-4">
					Frequently Asked Questions
				</h2>
				<div className="space-y-3">
					{[
						{
							q: "How do I reset my password?",
							a: 'Go to Settings & Privacy, click on "Change Password", and follow the prompts to set a new password.',
						},
						{
							q: "How do I delete my account?",
							a: "You can request account deletion from Settings & Privacy. Your data will be permanently removed within 30 days.",
						},
						{
							q: "How do I report inappropriate content?",
							a: 'Click the three dots (⋯) on any post, comment, or message and select "Report". Our moderation team reviews all reports.',
						},
						{
							q: "Can I make my profile private?",
							a: "Yes! Go to Settings & Privacy and toggle your account to private. Only approved followers will see your content.",
						},
						{
							q: "How do I block someone?",
							a: 'Visit their profile, click the three dots, and select "Block". Blocked users cannot see your profile or interact with your content.',
						},
					].map((faq, i) => (
						<div
							key={i}
							className="rounded-xl bg-muted/50 border p-5"
						>
							<h3 className="font-semibold text-sm mb-1.5">
								{faq.q}
							</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{faq.a}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Contact */}
			<section className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8 text-center">
				<Mail className="h-8 w-8 text-primary mx-auto mb-3" />
				<h2 className="text-xl font-bold mb-2">Still need help?</h2>
				<p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
					Our support team is available 24/7 to assist you with any
					questions or concerns.
				</p>
				<p className="text-primary font-semibold">support@sociax.com</p>
			</section>
		</div>
	);
}
