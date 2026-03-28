import { Megaphone, Mail, BarChart3, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Advertising · Sociax" };

export default function AdvertisingPage() {
	return (
		<div className="max-w-3xl mx-auto py-10 px-4">
			<div className="flex items-center gap-3 mb-8">
				<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
					<Megaphone className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Advertise on Sociax</h1>
					<p className="text-muted-foreground text-sm">
						Reach your audience where they connect
					</p>
				</div>
			</div>

			{/* Hero */}
			<div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8 mb-8 text-center">
				<h2 className="text-2xl font-bold mb-3">
					Grow Your Brand With Sociax
				</h2>
				<p className="text-muted-foreground max-w-lg mx-auto mb-6">
					Connect with engaged communities through targeted
					advertising. Our platform helps businesses of all sizes
					reach the right people at the right time.
				</p>
				<Button size="lg" className="gap-2">
					<Mail className="h-4 w-4" />
					Get Started
				</Button>
			</div>

			{/* Features */}
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{[
					{
						icon: Target,
						title: "Precise Targeting",
						desc: "Reach users by interests, location, and demographics.",
						color: "text-blue-500",
					},
					{
						icon: BarChart3,
						title: "Real-time Analytics",
						desc: "Track impressions, clicks, and conversions live.",
						color: "text-green-500",
					},
					{
						icon: Users,
						title: "Community Reach",
						desc: "Tap into groups, pages, and events for organic growth.",
						color: "text-purple-500",
					},
					{
						icon: Zap,
						title: "Boost Posts",
						desc: "Amplify your best content to a wider audience.",
						color: "text-amber-500",
					},
					{
						icon: Megaphone,
						title: "Brand Pages",
						desc: "Build a dedicated presence with a verified brand page.",
						color: "text-rose-500",
					},
					{
						icon: Mail,
						title: "Sponsored Messages",
						desc: "Reach users directly with personalized sponsored content.",
						color: "text-cyan-500",
					},
				].map((feature) => (
					<Card key={feature.title} className="border-border/50">
						<CardContent className="pt-5 pb-5">
							<feature.icon
								className={`h-8 w-8 mb-3 ${feature.color}`}
							/>
							<h3 className="font-semibold mb-1">
								{feature.title}
							</h3>
							<p className="text-sm text-muted-foreground">
								{feature.desc}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Pricing teaser */}
			<section className="rounded-xl bg-muted/50 border p-6 mb-8">
				<h2 className="text-xl font-semibold mb-3">Flexible Pricing</h2>
				<p className="text-sm text-muted-foreground leading-relaxed mb-4">
					Whether you&apos;re a small business or a large enterprise,
					we have advertising solutions that fit your budget. Start
					with as little as $5/day and scale as you grow.
				</p>
				<div className="grid grid-cols-3 gap-4">
					{[
						{ plan: "Starter", price: "$5/day", feat: "1K+ reach" },
						{
							plan: "Growth",
							price: "$25/day",
							feat: "10K+ reach",
						},
						{
							plan: "Enterprise",
							price: "Custom",
							feat: "Unlimited",
						},
					].map((p) => (
						<div
							key={p.plan}
							className="text-center bg-background rounded-lg p-4 border"
						>
							<p className="text-xs text-muted-foreground font-medium uppercase">
								{p.plan}
							</p>
							<p className="text-lg font-bold text-primary mt-1">
								{p.price}
							</p>
							<p className="text-xs text-muted-foreground">
								{p.feat}
							</p>
						</div>
					))}
				</div>
			</section>

			<p className="text-center text-sm text-muted-foreground">
				Contact us at{" "}
				<span className="text-primary font-medium">ads@sociax.com</span>{" "}
				for custom advertising solutions.
			</p>
		</div>
	);
}
