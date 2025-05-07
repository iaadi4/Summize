"use client"

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema } from "@/schemas/loginSchema";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/authClient";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function Signup() {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const { email, password } = values;
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/home"
    }, {
      onRequest: () => {
        setLoading(true);
        toast("Please wait", {
          position: "top-right",
          duration: 3000,
          icon: <LoaderCircle className="animate-spin h-4 w-4" />
        })
      },
      onSuccess: () => {
        setLoading(false);
        form.reset();
      },
      onError: (ctx) => {
        setLoading(false);
        toast.error(ctx.error.message || "Failed to signup, please try again!", {
          position: "top-right",
          duration: 3000
        })
      }
    });
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Welcome back! please login to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Password</FormLabel>
                      <FormLabel className="text-black font-semibold underline">
                        <Link href={'/forget-password'}>Forgot password?</Link>
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>Submit</Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <CardDescription>
            Dont&apos;t have an account yet?, <Link href="/signup" className="underline text-black font-semibold"> Sign up</Link>
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  )
}
