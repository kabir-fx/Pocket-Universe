import prisma from "@repo/db/prisma";
import { SessionStrategy } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

import brcypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  pages: {
    signIn: "/auth/signin",
  },
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
        clientId: process.env.GITHUB_ID || "",
        clientSecret: process.env.GITHUB_SECRET || "",
    }),
    // GoogleProvider({
    //     clientId: process.env.GOOGLE_CLIENT_ID || "",
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    // }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Enter Email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const userExists = await prisma.user.findFirst({
          where: {
            email: credentials.email,
          },
        });

        if (userExists) {
          if (!userExists?.password) {
            console.log("Password not set for this account. Use OAuth for Login");
            return null;
          }
          const decryptedPass = await brcypt.compare(credentials.password, userExists.password);
          if (!decryptedPass) {
            console.log("Incorrect Password");
            return null;
          }

          console.log("User found");

          return {
            id: userExists.id,
            name: userExists.name,
            email: userExists.email,
          };
        } else {
          console.log("user does not exists");
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],

  session: { strategy: "jwt" as SessionStrategy },

  callbacks: {
    async jwt({ token, user }: any) {

      return token;
    },

    async session({ session, token }: any) {
      session.user = {
        ...session.user,
        id: token.sub as string,
      };

      return session;
    },
  },
};
