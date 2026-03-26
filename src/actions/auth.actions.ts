"use server";

import { hashSync } from "bcrypt";
import { prisma } from "../../prisma/config/prisma";
import { randomUUID } from "crypto";

interface IRegister {
    email: string;
    password: string;
    userName: string;
}

export async function signUp(userData: IRegister) {
    const { email, password, userName } = userData;

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { userName }] },
    });

    if (existingUser) {
        throw new Error("User already exists with that email or username.");
    }

    const hash = hashSync(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hash,
            userName,
            active: true,
        },
    });

    await prisma.activateToken.create({
        data: {
            userId: user.id,
            token: `${randomUUID()}${randomUUID()}`.replace(/-/g, ""),
            activatedAt: new Date(),
        },
    });

    return user;
}
