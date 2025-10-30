/**
 * Email Validation Utilities
 * Prevents registration with disposable/temporary email addresses
 */

// Comprehensive list of disposable email domains
// Source: https://github.com/disposable-email-domains/disposable-email-domains
const DISPOSABLE_EMAIL_DOMAINS = [
  // Popular temporary email services
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'mailinator.com', 'mailinator.net', 'mailinator2.com',
  'tempmail.com', 'tempmail.net', 'temp-mail.org',
  'throwaway.email', 'trashmail.com', 'trashmail.net',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
  'spam4.me', 'maildrop.cc', 'yopmail.com',
  'getnada.com', 'fakeinbox.com', 'emailondeck.com',
  'mintemail.com', 'mytemp.email', 'mailtemp.com',
  'emailfake.com', 'moakt.com', 'dispostable.com',
  'throwawaymail.com', 'tempinbox.com', 'mohmal.com',
  'incognitomail.org', 'anonymbox.com', 'armyspy.com',
  'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu',
  'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'teleworm.us', 'cr7.icu', 'mailnesia.com', 'maildax.com',
  'getairmail.com', 'drdrb.com', 'harakirimail.com',
  'binkmail.com', 'bobmail.info', 'chammy.info',
  'devnullmail.com', 'letthemeatspam.com', 'nobulk.com',
  'spaml.com', 'spamfree24.com', 'wegwerfmail.de',
  'zehnminuten.de', 'mail-temporaire.fr', 'jetable.org',
  'meltmail.com', 'trashmailer.com', 'put2.net',
  'spamgourmet.com', 'thankyou2010.com', 'trash2009.com',
  'trash2010.com', 'trash2011.com', 'wimsg.com',
  'vsimcard.com', 'boun.cr', 'dropjar.com',
  'emailsensei.com', 'emailthe.net', 'gishpuppy.com',
  'mailexpire.com', 'mailforspam.com', 'mailfreeonline.com',
  'mailzi.ru', 'mt2009.com', 'mx0.wwwnew.eu',
  'mypartyclip.de', 'mytempemail.com', 'noclickemail.com',
  'nomail.xl.cx', 'nomail2me.com', 'nospam.ze.tc',
  'nospam4.us', 'nospamfor.us', 'nowmymail.com',
  'online.ms', 'ovpn.to', 'rppkn.com', 'safe-mail.net',
  'teleworm.com', 'tempemail.co.za', 'tempemail.com',
  'tempemail.net', 'tempemailaddress.com', 'tempinbox.co.uk',
  'tempmaildemo.com', 'tempmailer.com', 'tempmailer.de',
  'tmailinator.com', 'veryrealemail.com', 'webm4il.info',
  'zoemail.org', 'zoemail.com', 'mailcatch.com',
  'mailhazard.com', 'spambox.us', 'spamcannon.com',
  'spamcannon.net', 'spamcon.org', 'spamcorptastic.com',
  'spamday.com', 'spamfree.eu', 'spamgoes.in',
  'spamherelots.com', 'spamhereplease.com', 'spamhole.com',
  'spamify.com', 'spaml.de', 'spammotel.com',
  'spamobox.com', 'spamspot.com', 'speed.1s.fr',
  'mail.tm', 'minuteinbox.com', 'mohmal.im',
  'inboxbear.com', '33mail.com', 'tmail.ws',
  'emailna.co', 'fakemail.fr', 'inboxkitten.com',
  'luxusmail.org', 'trbvm.com', 'zetmail.com',
  'Mail.ru', // Часто используется для спама (Russian spam)
  'lycos.com', 'icloud.com' // Sometimes abused but be careful with these
];

/**
 * Validates if an email domain is disposable/temporary
 * @param email - Full email address to validate
 * @returns true if email is valid (not disposable), false if disposable
 */
export function isValidEmailDomain(email: string): boolean {
  try {
    const emailLower = email.toLowerCase().trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return false;
    }

    // Extract domain
    const domain = emailLower.split('@')[1];

    if (!domain) {
      return false;
    }

    // Check if domain is in disposable list
    const isDisposable = DISPOSABLE_EMAIL_DOMAINS.includes(domain);

    return !isDisposable; // Return true if NOT disposable
  } catch (error) {
    console.error('Error validating email domain:', error);
    return true; // Allow if validation fails (fail open, not fail closed)
  }
}

/**
 * Gets the domain from an email address
 * @param email - Full email address
 * @returns domain part of email
 */
export function getEmailDomain(email: string): string | null {
  try {
    const emailLower = email.toLowerCase().trim();
    const parts = emailLower.split('@');
    return parts.length === 2 ? parts[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Express middleware to validate email domain during registration
 */
export function validateEmailDomainMiddleware(req: any, res: any, next: any) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  if (!isValidEmailDomain(email)) {
    const domain = getEmailDomain(email);
    console.warn(`Blocked disposable email registration attempt: ${email}`);

    return res.status(400).json({
      error: 'Please use a permanent email address. Disposable or temporary email services are not allowed.',
      details: domain ? `The domain "${domain}" is not permitted for registration.` : undefined
    });
  }

  // Email domain is valid, continue
  next();
}

/**
 * Check if email is from a common legitimate provider
 * @param email - Email address to check
 * @returns true if from major provider (gmail, yahoo, outlook, etc.)
 */
export function isCommonEmailProvider(email: string): boolean {
  const commonProviders = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'proton.me',
    'aol.com', 'zoho.com', 'yandex.com', 'mail.com',
    'gmx.com', 'gmx.net', 'fastmail.com'
  ];

  const domain = getEmailDomain(email);
  return domain ? commonProviders.includes(domain) : false;
}
