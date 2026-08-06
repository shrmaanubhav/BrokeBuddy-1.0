import LegalPage from "./LegalPage";

const sections = [
  {
    title: "Introduction",
    content: (
      <p>
        BrokeBuddy is a personal finance assistant designed to help users
        automatically track, organize, and understand their expenses. Our
        service combines account authentication, email processing, and expense
        parsing to create a simpler and more useful financial overview.
      </p>
    ),
  },
  {
    title: "Information We Collect",
    content: (
      <ul>
        <li>Google account information such as your name, email address, and profile picture.</li>
        <li>Transaction confirmation emails accessed through the Gmail API after you explicitly consent.</li>
        <li>Parsed transaction details such as merchant name, amount, date, UPI reference, and category.</li>
        <li>User-created manual transactions entered into the app.</li>
        <li>Merchant nicknames you choose to help organize your spending history.</li>
      </ul>
    ),
  },
  {
    title: "How We Use Information",
    content: (
      <p>
        We use your information only to authenticate your account, read
        transaction confirmation emails, parse expenses, display analytics and
        dashboards, and improve the overall experience of the service.
      </p>
    ),
  },
  {
    title: "Gmail API Usage",
    content: (
      <ul>
        <li>Gmail access is requested only after explicit user consent.</li>
        <li>Only transaction-related emails are processed for expense extraction.</li>
        <li>Gmail data is not sold or used for advertising purposes.</li>
        <li>Gmail data is not shared with third parties except where necessary to operate the service.</li>
      </ul>
    ),
  },
  {
    title: "Data Storage",
    content: (
      <p>
        Transaction and account related information is stored securely in the
        application database and is managed according to the security practices
        used by the BrokeBuddy service.
      </p>
    ),
  },
  {
    title: "User Rights",
    content: (
      <ul>
        <li>You may disconnect your Google account at any time.</li>
        <li>You may request deletion of your account.</li>
        <li>You may request deletion of stored financial data.</li>
        <li>You may contact support for questions or requests related to your data.</li>
      </ul>
    ),
  },
  {
    title: "Third-party Services",
    content: (
      <p>
        BrokeBuddy uses Google OAuth and the Gmail API to provide account
        access and transaction email processing features. These services are
        governed by their own terms and privacy practices.
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
