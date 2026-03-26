"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginSchema } from "@/schemas/auth.schema";

export default function LoginPage() {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginSchema>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			emailOrUsername: "alicesmith0@sociax.dev",
			password: "Password123!",
		},
	});

	const onSubmit = async (data: LoginSchema) => {
		const result = await signIn("credentials", {
			emailOrUsername: data.emailOrUsername,
			password: data.password,
			redirect: false,
		});

		if (result?.error) {
			toast.error(result.error);
			return;
		}

		toast.success("Signed in successfully!");
		router.push("/feed");
		router.refresh();
	};

	return (
		<div className="flex items-center justify-center min-h-[70vh]">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Sign in</CardTitle>
					<CardDescription>
						Enter your credentials to access your account.
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="emailOrUsername">
								Email or Username
							</Label>
							<Input
								id="emailOrUsername"
								type="text"
								placeholder="you@example.com"
								{...register("emailOrUsername")}
							/>
							{errors.emailOrUsername && (
								<p className="text-destructive text-sm">
									{errors.emailOrUsername.message}
								</p>
							)}
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								{...register("password")}
							/>
							{errors.password && (
								<p className="text-destructive text-sm">
									{errors.password.message}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button
							type="submit"
							className="w-full"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Signing in…" : "Sign in"}
						</Button>
						<p className="text-sm text-muted-foreground text-center">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="underline hover:text-foreground"
							>
								Sign up
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
