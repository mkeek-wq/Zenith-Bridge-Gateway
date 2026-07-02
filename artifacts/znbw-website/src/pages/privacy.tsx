import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Privacy() {
  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Platform Notice
        </p>

        <h1 className="text-4xl font-serif mb-8">
          Privacy
        </h1>

        <div className="space-y-6 text-base leading-8 text-muted-foreground">
          <p>
            Zenith Nova Bridge Wave is an editorial and intelligence platform.
            We aim to collect only the information reasonably needed to operate,
            protect, and improve this website.
          </p>

          <p>
            We use basic analytics tools, including Google Analytics, to
            understand website traffic, page engagement, referral sources, and
            general usage patterns. This helps us improve editorial content,
            platform performance, and the overall reader experience.
          </p>

          <p>
            Analytics tools may use cookies or similar technologies to process
            limited technical and usage information, such as pages visited,
            browser type, device information, approximate location, and referral
            source. We do not intentionally send names, email addresses, phone
            numbers, contact form messages, or other directly identifiable
            personal information to analytics tools.
          </p>

          <p>
            If you contact us through the website, the information you provide
            is used only for communication, operational follow-up, and matters
            related to Zenith Nova Bridge Wave. We do not sell contact form
            information for advertising purposes.
          </p>

          <p>
            We may process limited technical information for security,
            troubleshooting, abuse prevention, and maintenance of the website.
          </p>

          <p>
            Visitors may control cookies through their browser settings. Some
            analytics or platform features may not function fully if cookies or
            similar technologies are disabled.
          </p>

          <p>
            This notice is intended to provide a clear, practical summary of how
            this website handles basic analytics and contact information. It may
            be updated as the platform develops.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
