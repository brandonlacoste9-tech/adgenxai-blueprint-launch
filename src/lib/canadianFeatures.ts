// Canadian-specific features and utilities for landing pages

export type Province = 
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT" | "NU" 
  | "ON" | "PE" | "QC" | "SK" | "YT";

export interface TaxInfo {
  gst: number;
  pst?: number;
  hst?: number;
  totalTax: number;
}

export const PROVINCE_TAXES: Record<Province, TaxInfo> = {
  "AB": { gst: 0.05, totalTax: 0.05 }, // Alberta - GST only
  "BC": { gst: 0.05, pst: 0.07, totalTax: 0.12 }, // British Columbia
  "MB": { gst: 0.05, pst: 0.07, totalTax: 0.12 }, // Manitoba
  "NB": { gst: 0.05, hst: 0.10, totalTax: 0.15 }, // New Brunswick - HST
  "NL": { gst: 0.05, hst: 0.10, totalTax: 0.15 }, // Newfoundland and Labrador - HST
  "NS": { gst: 0.05, hst: 0.10, totalTax: 0.15 }, // Nova Scotia - HST
  "NT": { gst: 0.05, totalTax: 0.05 }, // Northwest Territories - GST only
  "NU": { gst: 0.05, totalTax: 0.05 }, // Nunavut - GST only
  "ON": { gst: 0.05, hst: 0.08, totalTax: 0.13 }, // Ontario - HST
  "PE": { gst: 0.05, hst: 0.10, totalTax: 0.15 }, // Prince Edward Island - HST
  "QC": { gst: 0.05, pst: 0.09975, totalTax: 0.14975 }, // Quebec - GST + QST
  "SK": { gst: 0.05, pst: 0.06, totalTax: 0.11 }, // Saskatchewan
  "YT": { gst: 0.05, totalTax: 0.05 }, // Yukon - GST only
};

/**
 * Format Canadian price with tax information
 */
export const formatCanadianPrice = (
  price: number,
  province: Province = "ON",
  showTax: boolean = true,
  showBreakdown: boolean = false
): string => {
  const taxInfo = PROVINCE_TAXES[province];
  const taxAmount = price * taxInfo.totalTax;
  const totalPrice = price + taxAmount;

  if (!showTax) {
    return `$${price.toFixed(2)} CAD`;
  }

  if (showBreakdown) {
    const parts = [`$${price.toFixed(2)} CAD`];
    
    if (taxInfo.hst) {
      parts.push(`+ $${taxAmount.toFixed(2)} HST`);
    } else {
      parts.push(`+ $${(price * taxInfo.gst).toFixed(2)} GST`);
      if (taxInfo.pst) {
        parts.push(`+ $${(price * taxInfo.pst).toFixed(2)} ${province === "QC" ? "QST" : "PST"}`);
      }
    }
    
    parts.push(`= $${totalPrice.toFixed(2)} CAD total`);
    return parts.join(" ");
  }

  return `$${totalPrice.toFixed(2)} CAD (includes ${(taxInfo.totalTax * 100).toFixed(2)}% tax)`;
};

/**
 * Generate Interac payment button HTML
 */
export const generateInteracButton = (
  amount: number,
  merchantName: string,
  language: "en" | "fr" = "en"
): string => {
  const labels = {
    en: {
      payWith: "Pay with Interac",
      secure: "Secure payment",
    },
    fr: {
      payWith: "Payer avec Interac",
      secure: "Paiement sécurisé",
    },
  };

  const label = labels[language];

  return `
    <button 
      type="button" 
      class="interac-payment-btn"
      data-amount="${amount}"
      data-merchant="${merchantName}"
      aria-label="${label.payWith}"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#0066CC"/>
        <path d="M8 12H16M12 8V16" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>${label.payWith}</span>
      <small>${label.secure}</small>
    </button>
  `;
};

/**
 * Validate Canadian postal code format
 */
export const validateCanadianPostalCode = (postalCode: string): boolean => {
  // Canadian postal code format: A1A 1A1 or A1A1A1
  const cleaned = postalCode.replace(/\s+/g, "").toUpperCase();
  const pattern = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  return pattern.test(cleaned);
};

/**
 * Format Canadian postal code
 */
export const formatCanadianPostalCode = (postalCode: string): string => {
  const cleaned = postalCode.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return postalCode;
};

/**
 * Validate Canadian phone number
 */
export const validateCanadianPhoneNumber = (phone: string): boolean => {
  // Canadian phone format: (XXX) XXX-XXXX or XXX-XXX-XXXX or +1 XXX XXX XXXX
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  return /^1?\d{10}$/.test(cleaned);
};

/**
 * Format Canadian phone number
 */
export const formatCanadianPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Generate bilingual form HTML
 */
export interface FormField {
  name: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  label: { en: string; fr: string };
  required: boolean;
  placeholder?: { en: string; fr: string };
  options?: { en: string[]; fr: string[] };
}

export const generateBilingualForm = (
  fields: FormField[],
  language: "en" | "fr" | "bilingual" = "bilingual"
): string => {
  const currentLang = language === "bilingual" ? "en" : language;
  
  const formFields = fields.map(field => {
    const label = field.label[currentLang];
    const placeholder = field.placeholder?.[currentLang] || "";
    
    if (field.type === "textarea") {
      return `
        <div class="form-field">
          <label for="${field.name}">${label}${field.required ? " *" : ""}</label>
          <textarea 
            id="${field.name}" 
            name="${field.name}" 
            ${field.required ? "required" : ""}
            placeholder="${placeholder}"
            rows="4"
          ></textarea>
        </div>
      `;
    }
    
    if (field.type === "select" && field.options) {
      const options = field.options[currentLang].map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join("");
      return `
        <div class="form-field">
          <label for="${field.name}">${label}${field.required ? " *" : ""}</label>
          <select 
            id="${field.name}" 
            name="${field.name}" 
            ${field.required ? "required" : ""}
          >
            <option value="">${placeholder || "Select..."}</option>
            ${options}
          </select>
        </div>
      `;
    }
    
    return `
      <div class="form-field">
        <label for="${field.name}">${label}${field.required ? " *" : ""}</label>
        <input 
          type="${field.type}" 
          id="${field.name}" 
          name="${field.name}" 
          ${field.required ? "required" : ""}
          placeholder="${placeholder}"
        />
      </div>
    `;
  }).join("");

  return `
    <form class="bilingual-form" data-language="${language}">
      ${formFields}
      <button type="submit" class="submit-btn">
        ${language === "fr" ? "Envoyer" : "Submit"}
      </button>
    </form>
  `;
};

/**
 * Get Quebec legal disclaimer
 */
export const getQuebecLegalDisclaimer = (language: "en" | "fr"): string => {
  const disclaimers = {
    en: `This business operates in Quebec and complies with Quebec consumer protection laws. 
    For questions or complaints, contact the Office de la protection du consommateur.`,
    fr: `Cette entreprise opère au Québec et respecte les lois québécoises sur la protection du consommateur. 
    Pour des questions ou des plaintes, contactez l'Office de la protection du consommateur.`,
  };
  return disclaimers[language];
};

/**
 * Get Canadian business hours format
 */
export const formatCanadianBusinessHours = (
  hours: Record<string, { open: string; close: string }>,
  language: "en" | "fr" = "en"
): string => {
  const days = {
    en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    fr: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  };

  const dayLabels = days[language];
  const closedLabel = language === "fr" ? "Fermé" : "Closed";

  return Object.entries(hours).map(([day, time]) => {
    const dayIndex = dayLabels.findIndex(d => d.toLowerCase().startsWith(day.toLowerCase()));
    if (dayIndex === -1) return "";
    
    const dayLabel = dayLabels[dayIndex];
    if (time.open === "closed" || time.close === "closed") {
      return `${dayLabel}: ${closedLabel}`;
    }
    return `${dayLabel}: ${time.open} - ${time.close}`;
  }).filter(Boolean).join("<br>");
};
