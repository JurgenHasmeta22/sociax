import { Shield } from "lucide-react";

export const metadata = { title: "About · Sociax" };

export default function AboutPage() {
	return (
		<div className="max-w-3xl mx-auto py-10 px-4">
			<div className="flex items-center gap-3 mb-8">
				<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
					<Shield className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">About Sociax</h1>
					<p className="text-muted-foreground text-sm">
						Connecting people, building communities
					</p>
				</div>
			</div>

			<div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
				<section className="rounded-xl bg-muted/50 border p-6">
					<h2 className="text-xl font-semibold mb-3">Our Mission</h2>
					<p className="text-muted-foreground leading-relaxed">
						Sociax is a next-generation social platform built to
						bring people together. We believe in creating meaningful
						connections through shared experiences, open communities,
						and genuine interactions.
					</p>
				</section>

				<section className="rounded-xl bg-muted/50 border p-6">
					<h2 className="text-xl font-semibold mb-3">
						What We Offer
					</h2>
					<div className="grid sm:grid-cols-2 gap-4 mt-4">
						{[
							{
								title: "Social Feed",
								desc: "Share moments, photos, and stories with your network.",
							},
							{
								title: "Groups & Pages",
								desc: "Build and join communities around shared interests.",
							},
							{
								title: "Events",
								desc: "Organize and discover local or virtual events.",
							},
							{
								title: "Marketplace",
								desc: "Buy and sell within your trusted community.",
							},
							{
								title: "Messaging",
								desc: "Real-time conversations with friends and groups.",
							},
							{
								title: "Videos & Blog",
								desc: "Create and consume video content and articles.",
							},
						].map((item) => (
							<div
								key={item.title}
								className="bg-background rounded-lg p-4 border"
							>
								<h3 className="font-semibold text-sm mb-1">
									{item.title}
								</h3>
								<p className="text-xs text-muted-foreground">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</section>

				<section className="rounded-xl bg-muted/50 border p-6">
					<h2 className="text-xl font-semibold mb-3">Our Values</h2>
					<ul className="space-y-2 text-muted-foreground">
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>
								<strong className="text-foreground">
									Privacy First
								</strong>{" "}
								— Your data belongs to you. We never sell
								personal information.
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>
								<strong className="text-foreground">
									Community Driven
								</strong>{" "}
								— Features are built based on what our users
								need.
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>
								<strong className="text-foreground">
									Open & Transparent
								</strong>{" "}
								— We believe in honest communication with our
								community.
							</span>
						</li>
					</ul>
				</section>

				<p className="text-center text-sm text-muted-foreground pt-4">
					Sociax © {new Date().getFullYear()}. All rights reserved.
				</p>
			</div>
		</div>
	);
}
