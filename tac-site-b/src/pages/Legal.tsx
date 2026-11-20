import { PageHero } from '../components/ui'
import { company } from '../data/content'
import { useSeo } from '../lib/seo'

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy'
  useSeo(privacy ? 'Privacy Policy' : 'Terms & Conditions', privacy ? 'How TAC UAE handles information submitted through this website.' : 'Terms of use for the TAC UAE website.', privacy ? '/privacy-policy' : '/terms')
  return (
    <>
      <PageHero eyebrow="Legal" title={privacy ? 'Privacy Policy' : 'Terms & Conditions'} crumbs={[{ label: privacy ? 'Privacy Policy' : 'Terms & Conditions' }]} />
      <section className="pb-28">
        <div className="wrap max-w-3xl space-y-8 text-silver [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-white [&_p]:leading-relaxed [&_a]:text-cyan">
          {privacy ? (
            <>
              <div><h2>Who we are</h2><p>This website is operated by {company.legalName}, {company.addressLine}. Contact: <a href={`mailto:${company.email}`}>{company.email}</a>, {company.phone}.</p></div>
              <div><h2>What we collect</h2><p>When you submit an enquiry form we receive the details you enter: your name, company name, email address, phone number, the service and project type you are interested in, and your message. Our hosting infrastructure may also keep standard technical logs (such as IP address and browser type) for security and reliability.</p></div>
              <div><h2>How we use it</h2><p>We use enquiry details only to respond to you and to follow up on your request. We do not use the enquiry form to subscribe you to marketing lists.</p></div>
              <div><h2>Spam protection</h2><p>The form uses a hidden field, a minimum-fill-time check and rate limiting to prevent automated spam. No third-party tracking is used for this purpose.</p></div>
              <div><h2>Analytics &amp; cookies</h2><p>This site stores a single, non-personal item in your browser session to remember that the intro animation has been shown. If analytics is enabled by the site owner, anonymous usage statistics may be collected.</p></div>
              <div><h2>Your choices</h2><p>To ask what we hold about you, or to have your enquiry details deleted, email <a href={`mailto:${company.email}`}>{company.email}</a>.</p></div>
            </>
          ) : (
            <>
              <div><h2>Use of this website</h2><p>This website provides information about {company.name}, its services, products and projects. By using the site you agree to use it lawfully and not to interfere with its operation.</p></div>
              <div><h2>Information accuracy</h2><p>We take care to keep the information on this site accurate and up to date. Product descriptions, project details and figures are provided for general information and may change without notice. Please contact us to confirm details for your specific requirements.</p></div>
              <div><h2>Intellectual property</h2><p>Content on this site, including text, logos and product and project imagery, belongs to {company.legalName}, its partners or respective rights holders, and may not be reproduced without permission. Third-party product names and trademarks (including KNX, ThinKnx, Philips Hue, BTicino, Z-Wave, Modbus and Lutron) belong to their respective owners.</p></div>
              <div><h2>Enquiries</h2><p>Submitting an enquiry does not create a contract. Any supply of products or services is subject to a separate written agreement.</p></div>
              <div><h2>Contact</h2><p>Questions about these terms: <a href={`mailto:${company.email}`}>{company.email}</a>.</p></div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
