import LegalPage from "./LegalPage";

const sections = [
  {
    title: "Acceptance of Terms",
    content: (
      <p>
        By accessing or using BrokeBuddy, you agree to be bound by these Terms
        of Service. If you do not agree with these terms, please do not use the
        service.
      </p>
    ),
  },
  {
    title: "Eligibility",
    content: (
      <p>
        You must be at least the age of majority in your jurisdiction and have
        the legal authority to enter into these Terms. If you are using the
        service on behalf of an organization, you represent that you are
        authorized to bind that organization to these terms.
      </p>
    ),
  },
  {
    title: "Description of Service",
    content: (
      <p>
        BrokeBuddy helps users automatically organize and analyze personal
        financial transactions so they can better understand spending patterns,
        manage budgets, and review expense activity. The service integrates with
        Google OAuth and the Gmail API to support secure account access and
        transaction email processing.
      </p>
    ),
  },
  {
    title: "User Responsibilities",
    content: (
      <ul>
        <li>Provide accurate and up-to-date information when using the service.</li>
        <li>Keep your Google account access and sign-in credentials secure.</li>
        <li>Use the service lawfully and not attempt to misuse, overload, or abuse it.</li>
      </ul>
    ),
  },
  {
    title: "Account Security",
    content: (
      <p>
        You are responsible for maintaining the confidentiality of your account
        and for all activity that occurs under your account. If you believe your
        access has been compromised, you should disconnect the service or take
        appropriate steps to secure your Google account.
      </p>
    ),
  },
  {
    title: "Acceptable Use",
    content: (
      <ul>
        <li>Do not misuse the platform or attempt to interfere with its operation.</li>
        <li>Do not use the service for unlawful, fraudulent, or harmful purposes.</li>
        <li>Do not reverse engineer, scrape, or attempt to access the service in unauthorized ways.</li>
        <li>Do not attempt to abuse the platform through excessive requests or other disruptive behavior.</li>
      </ul>
    ),
  },
  {
    title: "Privacy",
    content: (
      <p>
        Your privacy is important to us. Please review the
        <a href="/privacy"> Privacy Policy</a> for details about how your data
        is collected, used, retained, and protected.
      </p>
    ),
  },
  {
    title: "Intellectual Property",
    content: (
      <p>
        BrokeBuddy, its branding, interface, content, and associated materials
        remain the property of the developers and may not be copied, republished,
        or reused without permission.
      </p>
    ),
  },
  {
    title: "Disclaimer",
    content: (
      <ul>
        <li>Expense categorization may not always be perfectly accurate.</li>
        <li>You remain responsible for verifying financial information before relying on it.</li>
        <li>BrokeBuddy does not provide financial, investment, tax, or legal advice.</li>
      </ul>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <p>
        BrokeBuddy is provided as-is and should not be held liable for indirect,
        incidental, special, or consequential damages arising from the use of
        the service, except where such limitation is prohibited by applicable
        law.
      </p>
    ),
  },
  {
    title: "Termination",
    content: (
      <p>
        We may suspend or terminate access to the service if you violate these
        Terms or otherwise use the service in a manner that creates risk to the
        platform, other users, or its operations.
      </p>
    ),
  },
  {
    title: "Changes to Terms",
    content: (
      <p>
        We may update these Terms of Service from time to time. Continued use of
        the service after updates means you accept the revised terms.
      </p>
    ),
  },
  {
    title: "Governing Law",
    content: (
      <p>
        These Terms are governed by the laws of India, without regard to its
        conflict of law principles.
      </p>
    ),
  },
  {
    title: "Contact",
    content: (
      <p>
        For questions about these terms, please contact us at
        <a href="mailto:brokebuddy.support@gmail.com"> brokebuddy.support@gmail.com</a>.
      </p>
    ),
  },
];

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These Terms of Service describe how you may use BrokeBuddy and what responsibilities apply when using our platform."
      sections={sections}
    />
  );
}
