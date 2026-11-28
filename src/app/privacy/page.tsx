import { Contact, LegalPage, SITE } from "@/components/Legal";

export const metadata = { title: "Privacy Policy", description: "How Evol collects, uses, stores and protects your personal data." };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="28 November 2026">
      <p>
        Evol (“Evol”, “we”, “us”) is a student-run learning and maker platform operated by Murugan U in Chennai, India. This policy explains what personal data we collect when you use
        <b> {SITE.replace("https://", "")}</b> and the Evol app (the “Service”), why we collect it, who can see it, and the choices you have.
        We follow India&apos;s Digital Personal Data Protection Act, 2023 (“DPDP Act”) and the Information Technology Act, 2000.
      </p>

      <h2>1. Who is responsible for your data</h2>
      <p>Evol, operated by Murugan U, is the “data fiduciary” for the personal data described here. See section 12 to contact us.</p>

      <h2>2. What we collect</h2>
      <h3>When you sign in</h3>
      <ul>
        <li><b>With Google:</b> your name, email address and Google profile picture, as provided by Google. We request only the basic sign-in scopes (openid, email, profile). We never access your Gmail, Drive, Contacts, Calendar or any other Google data.</li>
        <li><b>With email:</b> your email address, used to send you a one-time sign-in link.</li>
      </ul>
      <h3>When you register for a course</h3>
      <ul>
        <li>Full name, phone number (WhatsApp), and optionally your college.</li>
        <li>Payment details you give us to confirm your seat: the UPI transaction reference (UTR), the payer name shown on the payment, and a screenshot of the payment. We never see or store your UPI PIN, card details or bank login.</li>
        <li>Your declaration that you accept the course conditions.</li>
      </ul>
      <h3>While you learn</h3>
      <ul><li>Which classes you attended, the project link and note you submit, and any certificate issued to you.</li></ul>
      <h3>If you become a maker, buy, or post a request</h3>
      <ul>
        <li>Maker application (display name, bio, optional portfolio link), products you list (title, description, price, photo), and offers you send.</li>
        <li>Requests you post (what you need, budget, need-by date) and offers you receive.</li>
      </ul>
      <h3>Technical data</h3>
      <ul><li>Our hosting provider records standard server logs (IP address, browser type, time of request) for security and troubleshooting. We use only essential cookies to keep you signed in (see section 8).</li></ul>

      <h2>3. Why we use it (purposes)</h2>
      <ul>
        <li>To create your account and keep you signed in.</li>
        <li>To verify your payment and confirm your seat, and to give you your unique learner code.</li>
        <li>To run classes, check attendance, review projects and issue and verify certificates.</li>
        <li>To review makers and products, and to show your requests to approved makers so they can send offers.</li>
        <li>To email you about your registration, classes and certificate.</li>
        <li>To prevent fraud (for example, duplicate or fake payment proofs) and to keep the Service secure.</li>
      </ul>
      <p>We rely on your consent, given when you register or sign in, and on legitimate uses permitted by the DPDP Act such as meeting legal obligations. We do not use your data for advertising and we do not sell it.</p>

      <h2>4. Google user data</h2>
      <p>
        Evol&apos;s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
        The Google data we receive (name, email, profile picture) is used only to sign you in and identify your account inside Evol. We do not share it with third parties except the service providers listed
        in section 6, we do not use it for advertising, and no human reads it except as needed for support, security or legal reasons.
      </p>

      <h2>5. Who can see your data</h2>
      <ul>
        <li><b>You</b> can see your own registration, attendance, submissions and certificates.</li>
        <li><b>Evol administrators</b> can see registrations, payment proofs, attendance and submissions in order to run the course.</li>
        <li><b>Payment screenshots</b> are stored in a private area. Only you and Evol administrators can open them.</li>
        <li><b>Approved makers</b> can read the requests you post (not your email or phone number) and the offers they send.</li>
        <li><b>The public</b> can see a maker&apos;s display name and live products. Anyone who has a certificate ID can check it; that check shows only the holder&apos;s name, the course, the issue date and whether it is valid.</li>
      </ul>

      <h2>6. Service providers and transfers</h2>
      <p>We use the following providers to operate the Service. They process data only on our instructions:</p>
      <ul>
        <li><b>Supabase</b> for the database, file storage and sign-in.</li>
        <li><b>Vercel</b> for hosting the website and app.</li>
        <li><b>Google</b> for “Sign in with Google”.</li>
        <li>An email delivery provider for sign-in and notification emails.</li>
      </ul>
      <p>These providers may store data on servers outside India. We choose providers that apply appropriate security safeguards. We may also disclose data when required by law or a court order.</p>

      <h2>7. How long we keep it</h2>
      <ul>
        <li>Account and learning records: while your account is active, and up to 3 years after your last batch so that you can retrieve certificates and we can answer disputes.</li>
        <li>Payment screenshots: deleted within 12 months after the batch ends, unless a dispute or legal requirement means we must keep them longer. We keep the transaction reference for accounting.</li>
        <li>Certificates: kept so that verification keeps working. If you ask us to delete your data, we can revoke rather than erase the certificate record.</li>
        <li>Marketplace and request content: until you delete it or your account.</li>
      </ul>

      <h2>8. Cookies and similar technologies</h2>
      <p>We use only essential cookies and browser storage that keep you signed in and remember that you have seen the intro animation during your visit. We do not use advertising or tracking cookies.</p>

      <h2>9. Security</h2>
      <p>Data is encrypted in transit (HTTPS). Access is controlled by row-level security rules in the database, so you can read only your own records. Admin actions are checked on the server and in the database. No online service is perfectly secure; if there is a breach that affects you, we will notify you and the authorities as the law requires.</p>

      <h2>10. Children</h2>
      <p>The Service is intended for people aged 18 and over. If you are under 18, you may use it only with the consent and supervision of a parent or legal guardian, who must register on your behalf. We do not knowingly collect data about children without that consent. If you believe a child has used the Service without it, contact us and we will delete the data.</p>

      <h2>11. Your rights and choices</h2>
      <p>Under the DPDP Act you can ask us to: access the personal data we hold about you; correct or update it; erase it; withdraw your consent; and nominate someone to exercise these rights for you. You can also complain to us first, and then to the Data Protection Board of India. To delete your Google-linked account or any of your data, contact us as described below and tell us the email you used to sign in. You can also revoke Evol&apos;s access at any time in your Google Account settings under “Third-party apps &amp; services”.</p>

      <h2>12. Contact and grievances</h2>
      <Contact />
      <p>Grievance contact: Murugan U, founder, Evol, Chennai, India.</p>

      <h2>13. Changes to this policy</h2>
      <p>If we change this policy in a meaningful way we will update the date above and, where appropriate, notify you in the app or by email. Continuing to use the Service after a change means you accept the updated policy.</p>
    </LegalPage>
  );
}
