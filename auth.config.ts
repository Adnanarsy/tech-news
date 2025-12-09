import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { usersContainer } from "@/lib/azure/cosmos";
import type { User } from "@/types/domain";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials: unknown) => {
        const parse = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parse.success) return null;
        const { email, password } = parse.data;
        const container = await usersContainer();
        const { resources } = await container.items
          .query<User>({
            query: "SELECT TOP 1 * FROM c WHERE c.type = 'user' AND c.email = @e",
            parameters: [{ name: "@e", value: email }],
          })
          .fetchAll();
        const user = resources[0];
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
        if (session.user) {
        (session as any).user.id = token.uid as string;
        (session as any).user.role = token.role as string;
        }
        return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
