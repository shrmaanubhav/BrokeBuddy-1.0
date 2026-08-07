import LegalPage from "./LegalPage";

const sections = [
  {
    title: "Introduction",
    content: (
      <>
        <p>
          BrokeBuddy is a personal finance assistant designed to help users
          automatically track, organize, and understand their expenses. Our
          service combines account authentication, email processing, and expense
          parsing to create a simpler and more useful financial overview.
        </p>
        <blockquote>
          <strong>Important:</strong> BrokeBuddy only requests read-only Gmail
          access after you explicitly consent. We process only bank or payment
          transaction confirmation emails for expense extraction, we never send,
          delete, modify, or compose emails, and Gmail data is never used for
          advertising.
        </blockquote>
      </>
    ),
  },
  {
    title: "Information We Collect",
    content: (
      <ul>
        <li>
          Google account information such as your name, email address, and
          profile picture when you sign in with Google.
        </li>
        <li>
          Gmail transaction confirmation emails that you choose to allow the app
          to access for expense extraction.
        </li>
        <li>
          Parsed transaction information such as merchant name, amount, date,
          UPI reference, and inferred category.
        </li>
        <li>
          User-created data such as manual transactions, merchant nicknames,
          budget settings, and other preferences entered into the service.
        </li>
      </ul>
    ),
  },
  {
    title: "How We Use Your Information",
    content: (
      <ul>
        <li>To authenticate your account and keep your sign-in secure.</li>
        <li>
          To identify and process transaction confirmation emails for expense
          extraction and categorization.
        </li>
        <li>To generate analytics and spending insights for your account.</li>
        <li>To support budget planning and expense organization features.</li>
        <li>To improve the reliability, functionality, and overall experience of the service.</li>
      </ul>
    ),
  },
  {
    title: "Gmail API Usage",
    content: (
      <ul>
        <li>Gmail access is requested only after explicit user consent.</li>
        <li>
          BrokeBuddy requests read-only Gmail access and does not send, delete,
          modify, or compose emails.
        </li>
        <li>
          The application identifies and processes bank or payment transaction
          confirmation emails to extract expenses.
        </li>
        <li>
          Personal emails that are unrelated to financial transactions are not
          intentionally processed or stored for expense extraction purposes.
        </li>
        <li>Gmail data is never used for advertising or promotional targeting.</li>
      </ul>
    ),
  },
  {
    title: "Google API Services User Data",
    content: (
      <p>
        BrokeBuddy&apos;s use and transfer of information received from Google
        APIs adheres to the Google API Services User Data Policy, including the
        Limited Use requirements.
      </p>
    ),
  },
  {
    title: "Data Storage",
    content: (
      <p>
        Account data, transaction information, and related preferences are stored
        securely using reasonable industry-standard security practices and
        access controls appropriate for the operation of the service.
      </p>
    ),
  },
  {
    title: "Data Retention",
    content: (
      <p>
        We retain account and transaction data for as long as necessary to provide
        the service, support your account activity, and fulfill legitimate
        operational needs. If you request deletion of your account or related
        data, we will process that request in accordance with our available
        account-management procedures.
      </p>
    ),
  },
  {
    title: "Data Sharing",
    content: (
      <p>
        BrokeBuddy does not sell, rent, or share your personal or financial data
        with advertisers. We only share information where it is necessary to
        operate the service, such as with Google for authentication and Gmail
        access, and with trusted infrastructure providers that help host and
        maintain the application.
      </p>
    ),
  },
  {
    title: "User Rights",
    content: (
      <ul>
        <li>You may disconnect your Google account at any time.</li>
        <li>You may request deletion of your account and associated data.</li>
        <li>You may request removal or correction of stored financial data.</li>
        <li>You may contact support for questions or requests related to your data.</li>
      </ul>
    ),
  },
  {
    title: "Security",
    content: (
      <p>
        We use HTTPS, authentication safeguards, and other reasonable security
        measures to protect your data. However, no method of transmission or
        storage is completely infallible, and you should take appropriate care
        when managing your account access.
      </p>
    ),
  },
  {
    title: "Third-Party Services",
    content: (
      <p>
        BrokeBuddy uses Google OAuth and the Gmail API to provide account access
        and transaction email processing features. These services are governed by
        their own terms and privacy practices.
      </p>
    ),
  },
  {
    title: "Contact",
    content: (
      <p>
        For privacy-related questions or requests, please contact us at
        <a href="mailto:brokebuddy.support@gmail.com"> brokebuddy.support@gmail.com</a>.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This Privacy Policy explains what information BrokeBuddy collects, how it is used, and the choices available to you when using our service."
      sections={sections}
    />
  );
}
