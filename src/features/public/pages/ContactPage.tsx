import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

const WEB3FORMS_ACCESS_KEY =
  import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? "e57c7809-f6ae-43c3-b167-f42b95e72518";

const subjectOptions = [
  { value: "general", label: "General enquiry" },
  { value: "plan-support", label: "Plan support" },
  { value: "custom-design", label: "Custom design" },
  { value: "partnership", label: "Partnership" },
  { value: "billing", label: "Billing" },
];

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "general",
  message: "",
};

export default function ContactPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ContactFormState>(initialState);

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      name: prev.name || user.fullName || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const updateField = <K extends keyof ContactFormState>(field: K, value: ContactFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject:
            subjectOptions.find((option) => option.value === form.subject)?.label ?? "General enquiry",
          message: form.message.trim(),
          from_name: "NEXii Studio Contact Form",
          botcheck: false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || "Unable to send your message right now.");
      }

      toast.success("Message sent successfully. We'll get back to you soon.");
      setForm(initialState);
      if (user) {
        setForm((prev) => ({
          ...prev,
          name: user.fullName ?? "",
          email: user.email ?? "",
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send your message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary to-primary/80 text-white">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute left-1/4 top-8 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <MessageSquareText className="h-4 w-4" />
              Contact the NEXii team
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Let's talk about your next plan, project, or custom design.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Use the form to reach us directly. We respond with the next step, whether you need
              help choosing a plan, want a custom design, or simply have a question about the
              process.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Card className="border-white/15 bg-white/10 text-white shadow-none backdrop-blur">
                <CardContent className="p-5">
                  <Mail className="mb-3 h-5 w-5 text-cyan-200" />
                  <p className="text-sm text-white/70">Email</p>
                  <a href="mailto:info@nexii.com" className="text-base font-semibold hover:underline">
                    info@nexii.com
                  </a>
                </CardContent>
              </Card>
              <Card className="border-white/15 bg-white/10 text-white shadow-none backdrop-blur">
                <CardContent className="p-5">
                  <Phone className="mb-3 h-5 w-5 text-cyan-200" />
                  <p className="text-sm text-white/70">Phone</p>
                  <a href="tel:+250796066681" className="text-base font-semibold hover:underline">
                    +250 796066681
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-0 bg-white shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-primary">Send a message</p>
                  <h2 className="mt-1 text-2xl font-semibold text-foreground">
                    Contact form powered by Web3Forms
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Your message will go straight to the team using the access key already linked
                    to this form.
                  </p>
                </div>
                <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary sm:block">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="+250 ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Reason for contact</Label>
                    <Select value={form.subject} onValueChange={(value) => updateField("subject", value)}>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={7}
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    placeholder="Tell us what you need help with, the plan you are interested in, or the custom brief you want to discuss."
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <Clock3 className="mb-4 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Response time</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We usually reply within 24 to 48 hours with the next best step.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <MapPin className="mb-4 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Project coverage</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We work with clients across Africa and international markets.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <ShieldCheck className="mb-4 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Secure workflow</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your submission is sent directly through Web3Forms without exposing your backend.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 rounded-3xl border border-border/60 bg-muted/40 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  Prefer to browse first?
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Take a look at the available plans</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  If you already know the style you want, the catalog is the fastest way to move
                  forward.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link to="/catalog">
                  Browse Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
