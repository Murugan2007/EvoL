import { Contact, LegalPage } from "@/components/Legal";

export const metadata = { title: "Terms of Service and Refund Policy", description: "The rules for using Evol: courses, certificates, refunds, marketplace and requests." };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service and Refund Policy" updated="28 November 2026">
      <p>These terms are an agreement between you and Evol, a student-run learning and maker platform operated by Murugan U in Chennai, India. By creating an account, registering for a course, or using the Service, you agree to them. If you do not agree, please do not use the Service. Our <a className="font-semibold text-evol" href="/privacy">Privacy Policy</a> explains how we handle your data.</p>

      <h2>1. Your account</h2>
      <ul>
        <li>You must give accurate information and keep your sign-in secure. You are responsible for activity on your account.</li>
        <li>You must be 18 or older, or use Evol with a parent or guardian&apos;s consent and supervision.</li>
        <li>We may suspend or remove accounts that break these terms.</li>
      </ul>

      <h2>2. Courses and batches</h2>
      <ul>
        <li>Seats are limited. A seat is confirmed only when we approve your payment. We show your unique learner code in the app once you are approved.</li>
        <li>Classes are held online. Dates, times and join links are shown in the app to approved learners only. Please do not share them.</li>
        <li>Rename yourself in the meeting to your learner code and first name (for example “EV7K3Q - Asha”) so that we can verify attendance. We may remove participants we cannot verify.</li>
        <li>Course content, schedules and instructors may change. We will tell you about important changes in the app or by email.</li>
      </ul>

      <h2>3. Certificate of completion</h2>
      <ul>
        <li>To receive a certificate you must attend at least 50% of the scheduled classes and submit the course project, which we must accept.</li>
        <li>The certificate is a certificate of completion issued by Evol. It is not an accredited, university or government qualification, and we make no promise about jobs or admissions.</li>
        <li>Each certificate has a unique ID that anyone can check on our verification page. We may revoke a certificate if it was obtained by cheating, copying someone else&apos;s work or giving false information.</li>
        <li>Any free resources or prizes mentioned in an announcement (for example a placement cheat sheet or a prize for a top learner) are provided at our discretion and under the conditions stated in that announcement.</li>
      </ul>

      <h2>4. Fees and refund policy</h2>
      <ul>
        <li>The registration fee is shown before you pay. At registration you declare that you have paid it and that it is non-refundable.</li>
        <li><b>Registration fees are non-refundable</b> once your seat is approved, including if you do not attend or do not finish.</li>
        <li><b>Exceptions:</b> (a) if Evol cancels a batch, we will offer you a seat in the next batch or a full refund; (b) if you were charged more than once for the same registration, we will refund the extra amount; (c) if your payment was received but we could not give you a seat (for example the batch was full), we will refund it in full.</li>
        <li>Approved refunds are paid to the same UPI account within 10 working days.</li>
        <li>Fake, edited or reused payment proof will lead to rejection of the registration and removal from the Service, without refund.</li>
      </ul>

      <h2>5. Marketplace, makers and requests</h2>
      <ul>
        <li><b>Makers</b> are reviewed by Evol before they can sell, and each product is reviewed before it appears. A review is not a guarantee of quality, safety or legality. Makers are responsible for what they list, for describing it accurately, and for following Indian law (including consumer, product-safety and electrical-safety rules).</li>
        <li><b>Buyers:</b> Online checkout with held payments is being built and is not yet available. Until it launches, please do not pay a maker outside Evol for something you found here, and do not share OTPs, UPI PINs or passwords with anyone.</li>
        <li><b>Requests:</b> What you post in a request, including your idea and budget, is visible to approved makers so they can send offers. Do not put phone numbers, email addresses or confidential designs in a request. An offer is a proposal, not a contract, until we launch the ordering and payment flow.</li>
        <li>Do not list or ask for anything illegal, dangerous, counterfeit, or that infringes someone&apos;s rights. We may remove content and accounts without notice.</li>
      </ul>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>Do not try to access other people&apos;s data, break or overload the Service, scrape it, or bypass its security.</li>
        <li>Do not submit work that is not yours, impersonate others, harass anyone, or share content that is unlawful or abusive.</li>
      </ul>

      <h2>7. Your content and our content</h2>
      <p>You keep ownership of what you create and upload (projects, product photos and descriptions, requests). You give Evol a limited licence to store, display and process it so that we can run the Service (for example, to show your product on the marketplace). The Evol name, logo, course material and software belong to Evol or its licensors; you may use them only for your own learning.</p>

      <h2>8. Disclaimers and limits of liability</h2>
      <p>Evol is a student-run initiative. The Service is provided “as is” and “as available”. To the extent the law allows, we do not guarantee uninterrupted or error-free service, and we are not liable for indirect or consequential losses, or for transactions or disputes between users and makers. Our total liability for any claim relating to a course is limited to the amount you paid us for it. Nothing in these terms limits rights you have under Indian consumer law that cannot be waived.</p>

      <h2>9. Ending your use</h2>
      <p>You can stop using the Service at any time and ask us to delete your data (see the Privacy Policy). We may suspend or end access if you break these terms, with or without notice for serious breaches.</p>

      <h2>10. Changes</h2>
      <p>We may update these terms. If we make a significant change we will update the date above and tell you in the app. Using the Service after a change means you accept it.</p>

      <h2>11. Governing law and disputes</h2>
      <p>These terms are governed by the laws of India. Courts in Chennai, Tamil Nadu have jurisdiction, subject to any rights you have under consumer protection law. Please contact us first and we will try to resolve the issue in good faith.</p>

      <h2>12. Contact</h2>
      <Contact />
    </LegalPage>
  );
}
