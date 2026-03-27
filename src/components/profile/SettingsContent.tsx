"use client";

import { useState, useTransition } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { User, Shield, Lock, Globe, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
	updateUserProfile,
	updateProfilePrivacy,
	changePassword,
} from "@/actions/user.actions";
import type {
	ProfilePrivacy,
	Gender,
} from "../../../prisma/generated/prisma/enums";

type SettingsUser = {
	id: number;
	firstName: string | null;
	lastName: string | null;
	userName: string;
	email: string;
	bio: string | null;
	location: string | null;
	website: string | null;
	phone: string | null;
	birthday: Date | null;
	gender: string;
	profilePrivacy: string;
	hasPassword: boolean;
};

const SECTIONS = [
	{ id: "account", label: "Account", icon: User },
	{ id: "privacy", label: "Privacy", icon: Shield },
	{ id: "security", label: "Security", icon: Lock },
] as const;

type Section = (typeof SECTIONS)[number]["id"];

const PRIVACY_OPTIONS: {
	value: ProfilePrivacy;
	label: string;
	description: string;
	icon: React.ElementType;
}[] = [
	{
		value: "Public",
		label: "Public",
		description:
			"Anyone can view your posts, friends list, pages, groups, and events.",
		icon: Globe,
	},
	{
		value: "FriendsOnly",
		label: "Friends only",
		description:
			"Only your friends can see your content. Others see only your profile header.",
		icon: Users,
	},
	{
		value: "Private",
		label: "Private",
		description:
			"Only you can see your posts, friends, pages, groups, and events.",
		icon: Lock,
	},
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
	{ value: "Male", label: "Male" },
	{ value: "Female", label: "Female" },
	{ value: "Other", label: "Other" },
	{ value: "PreferNotToSay", label: "Prefer not to say" },
];

function AccountSection({ user }: { user: SettingsUser }) {
	const [isPending, startTransition] = useTransition();
	const [firstName, setFirstName] = useState(user.firstName ?? "");
	const [lastName, setLastName] = useState(user.lastName ?? "");
	const [bio, setBio] = useState(user.bio ?? "");
	const [location, setLocation] = useState(user.location ?? "");
	const [website, setWebsite] = useState(user.website ?? "");
	const [phone, setPhone] = useState(user.phone ?? "");
	const [birthday, setBirthday] = useState(
		user.birthday
			? new Date(user.birthday).toISOString().split("T")[0]
			: "",
	);
	const [gender, setGender] = useState<Gender>(user.gender as Gender);

	const handleSave = () => {
		startTransition(async () => {
			try {
				await updateUserProfile({
					firstName,
					lastName,
					bio,
					location,
					website,
					phone,
					birthday,
					gender,
				});
				toast.success("Profile updated.");
			} catch {
				toast.error("Failed to update profile.");
			}
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Account information</CardTitle>
				<CardDescription>Update your personal details.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="firstName">First name</Label>
						<Input
							id="firstName"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							placeholder="First name"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="lastName">Last name</Label>
						<Input
							id="lastName"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							placeholder="Last name"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						value={user.email}
						disabled
						className="text-muted-foreground"
					/>
					<p className="text-xs text-muted-foreground">
						Email cannot be changed here.
					</p>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="bio">Bio</Label>
					<Textarea
						id="bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						placeholder="Tell people a little about yourself..."
						className="resize-none min-h-[80px]"
						maxLength={300}
					/>
					<p className="text-xs text-muted-foreground text-right">
						{bio.length}/300
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="location">Location</Label>
						<Input
							id="location"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="City, Country"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="website">Website</Label>
						<Input
							id="website"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
							placeholder="https://yoursite.com"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="phone">Phone</Label>
						<Input
							id="phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+1 555 000 0000"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="birthday">Birthday</Label>
						<Input
							id="birthday"
							type="date"
							value={birthday}
							onChange={(e) => setBirthday(e.target.value)}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label>Gender</Label>
					<Select
						value={gender}
						onValueChange={(v) => setGender(v as Gender)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{GENDER_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex justify-end pt-2">
					<Button onClick={handleSave} disabled={isPending}>
						{isPending ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function PrivacySection({ user }: { user: SettingsUser }) {
	const [isPending, startTransition] = useTransition();
	const [privacy, setPrivacy] = useState<ProfilePrivacy>(
		user.profilePrivacy as ProfilePrivacy,
	);

	const handleSave = () => {
		startTransition(async () => {
			try {
				await updateProfilePrivacy(privacy);
				toast.success("Privacy settings updated.");
			} catch {
				toast.error("Failed to update privacy.");
			}
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile privacy</CardTitle>
				<CardDescription>
					Control who can see your posts, friends list, groups, pages,
					and events on your profile.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<RadioGroup
					value={privacy}
					onValueChange={(v) => setPrivacy(v as ProfilePrivacy)}
					className="space-y-3"
				>
					{PRIVACY_OPTIONS.map(
						({ value, label, description, icon: Icon }) => (
							<label
								key={value}
								htmlFor={`privacy-${value}`}
								className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
									privacy === value
										? "border-primary bg-primary/5"
										: "border-border hover:bg-muted/50"
								}`}
							>
								<RadioGroupItem
									value={value}
									id={`privacy-${value}`}
									className="mt-0.5"
								/>
								<div className="flex items-start gap-3 flex-1 min-w-0">
									<div
										className={`mt-0.5 rounded-full p-1.5 ${privacy === value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
									>
										<Icon className="h-4 w-4" />
									</div>
									<div>
										<p className="font-semibold text-sm">
											{label}
										</p>
										<p className="text-sm text-muted-foreground mt-0.5">
											{description}
										</p>
									</div>
								</div>
							</label>
						),
					)}
				</RadioGroup>

				<div className="flex justify-end pt-2">
					<Button onClick={handleSave} disabled={isPending}>
						{isPending ? "Saving..." : "Save privacy settings"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function SecuritySection({ hasPassword }: { hasPassword: boolean }) {
	const [isPending, startTransition] = useTransition();
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNext, setShowNext] = useState(false);

	const handleSave = () => {
		if (!next || !confirm) {
			toast.warning("Please fill in all password fields.");
			return;
		}
		if (next !== confirm) {
			toast.warning("New passwords do not match.");
			return;
		}
		if (next.length < 8) {
			toast.warning("Password must be at least 8 characters.");
			return;
		}

		startTransition(async () => {
			try {
				await changePassword(current, next);
				toast.success("Password changed successfully.");
				setCurrent("");
				setNext("");
				setConfirm("");
			} catch (e) {
				toast.error(
					e instanceof Error
						? e.message
						: "Failed to change password.",
				);
			}
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Security</CardTitle>
				<CardDescription>
					{hasPassword
						? "Change your account password."
						: "This account uses social login — no password is set."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{hasPassword ? (
					<>
						<div className="space-y-1.5">
							<Label htmlFor="currentPassword">
								Current password
							</Label>
							<div className="relative">
								<Input
									id="currentPassword"
									type={showCurrent ? "text" : "password"}
									value={current}
									onChange={(e) => setCurrent(e.target.value)}
									placeholder="Enter current password"
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowCurrent((p) => !p)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showCurrent ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="newPassword">New password</Label>
							<div className="relative">
								<Input
									id="newPassword"
									type={showNext ? "text" : "password"}
									value={next}
									onChange={(e) => setNext(e.target.value)}
									placeholder="At least 8 characters"
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowNext((p) => !p)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showNext ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="confirmPassword">
								Confirm new password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								placeholder="Repeat new password"
							/>
						</div>

						<div className="flex justify-end pt-2">
							<Button onClick={handleSave} disabled={isPending}>
								{isPending ? "Changing..." : "Change password"}
							</Button>
						</div>
					</>
				) : (
					<p className="text-sm text-muted-foreground">
						Your account is linked via a social provider. Password
						management is handled by that provider.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export function SettingsContent({ user }: { user: SettingsUser }) {
	const [activeSection, setActiveSection] = useState<Section>("account");

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">Settings</h1>

			<div className="flex flex-col md:flex-row gap-6">
				<aside className="md:w-52 shrink-0">
					<nav className="space-y-1">
						{SECTIONS.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								onClick={() => setActiveSection(id)}
								className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
									activeSection === id
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4 shrink-0" />
								{label}
							</button>
						))}
					</nav>

					<Separator className="my-4 md:hidden" />
				</aside>

				<div className="flex-1 min-w-0">
					{activeSection === "account" && (
						<AccountSection user={user} />
					)}
					{activeSection === "privacy" && (
						<PrivacySection user={user} />
					)}
					{activeSection === "security" && (
						<SecuritySection hasPassword={user.hasPassword} />
					)}
				</div>
			</div>
		</div>
	);
}
