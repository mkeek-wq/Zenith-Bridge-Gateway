import { FormEvent, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Mail, MapPin, Send } from "lucide-react";
import { apiFetch } from "@/api/client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");

    try {
      await apiFetch("/api/v1/contact", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          company,
          message,
        }),
      });

      setStatus("success");
      setFeedback("Thank you. Your message has been received.");
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setFeedback("Sorry, your message could not be sent. Please try again later.");
    }
  }

  return (
    <PublicLayout>
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <p className="text-secondary uppercase tracking-[0.3em] text-sm font-medium mb-4">
            Contact
          </p>
          <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-6">
            Let&apos;s build meaningful bridges.
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/75 max-w-2xl">
            For collaborations, editorial enquiries, partnerships, or strategic conversations, reach out to Zenith Nova Bridge Wave.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl grid lg:grid-cols-[1.3fr_0.7fr] gap-10">
          <form onSubmit={handleSubmit} className="border border-border rounded-sm p-8 bg-card space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="w-full border border-border bg-background px-4 py-3 rounded-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full border border-border bg-background px-4 py-3 rounded-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="company">
                Company / Organisation
              </label>
              <input
                id="company"
                className="w-full border border-border bg-background px-4 py-3 rounded-sm"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                className="w-full min-h-40 border border-border bg-background px-4 py-3 rounded-sm"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-sm font-medium disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            {feedback && (
              <p className={status === "error" ? "text-red-500" : "text-secondary"}>
                {feedback}
              </p>
            )}
          </form>

          <aside className="space-y-6">
            <div className="border border-border rounded-sm p-8 bg-card">
  <Mail className="w-8 h-8 text-secondary mb-6" />
  <h2 className="font-serif text-2xl mb-3">Contact</h2>
  <p className="text-muted-foreground">
    Please use the contact form for enquiries. We aim to respond within 2–3 business days.
  </p>
</div>

            <div className="border border-border rounded-sm p-8 bg-card">
              <MapPin className="w-8 h-8 text-secondary mb-6" />
              <h2 className="font-serif text-2xl mb-3">Location</h2>
              <p className="text-muted-foreground">
                Singapore-based, globally connected.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
