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
    title: "Description of Service",
    content: (
      <p>
        BrokeBuddy helps users automatically organize and analyze personal
        financial transactions so they can better understand spending patterns
        and manage their budgets.
      </p>
    ),
  },
  {
    title: "User Responsibilities",
    content: (
      <ul>
        <li>Provide accurate and up-to-date information when using the service.</li>
        <li>Keep your Google account credentials and access secure.</li>
        <li>Use the service lawfully and not attempt to misuse or abuse it.</li>
      </ul>
    ),
  },
  {
    title: "Privacy",
    content: (
      <p>
        Your privacy is important to us. Please review the
        <a href="/privacy"> Privacy Policy</a> for details about how your data
        is collected and used.
      </p>
    ),
  },
  {
    title: "Intellectual Property",
    content: (
      <p>
        BrokeBuddy, its branding, interface, content, and associated materials
        remain the property of the developers and may not be copied or reused
        without permission.
      </p>
    ),
  },
  {
    title: "Disclaimer",
    content: (
      <ul>
        <li>Expense categorization may not always be perfectly accurate.</li>
        <li>You remain responsible for verifying financial information before relying on it.</li>
        <li>BrokeBuddy does not provide financial, legal, or tax advice.</li>
      </ul>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <p>
        BrokeBuddy is provided as-is and should not be held liable for indirect,
        incidental, or consequential damages arising from the use of the
        service.
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
