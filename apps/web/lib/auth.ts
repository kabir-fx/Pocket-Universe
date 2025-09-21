import prisma from "@repo/db/prisma";
import { SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import GithubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  // Configure one or more authentication providers
  providers: [
    // GithubProvider({
    //     clientId: process.env.GITHUB_ID || "",
    //     clientSecret: process.env.GITHUB_SECRET || "",
    // }),
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
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter Username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials.password) return null;

        const userExists = await prisma.user.findFirst({
          where: {
            username: credentials?.username,
          },
        });

        if (userExists) {
          // In a real app, you'd verify the password here
          // For now, just return the user (excluding password)
          console.log("User found");

          return {
            id: userExists.id,
            username: userExists.username,
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
      if (user) {
        token.sub = user.id;
        // Populate the name of the token with username to pass on to display on navbar
        token.name = user.username;
      }
      return token;
    },

    async session({ session, token }: any) {
      session.user = {
        ...session.user,
        id: token.sub as string,
        // Bring the username [from token.name] into the session
        name: token.name as string,
      };

      return session;
    },
  },
};
