"use client"

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
import signupSchema from "@/schemas/signupSchema";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/authClient";
import { toast } from 'sonner';
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function Signup() {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  })
  async function onSubmit(values: z.infer<typeof signupSchema>) {
    const { name, email, password } = values;
    await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/login"
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
        redirect('/login');
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
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Atleast 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Re-type your password" {...field} />
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
            Already have an account?, <Link href="/login" className="underline text-black font-semibold"> Login</Link>
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  )
}
