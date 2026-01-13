import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Comprehensive Iowa resource data
    const iowaResources = [
      // Crisis & Navigation
      {
        name: "211 Iowa",
        category: "Crisis & Navigation",
        county: "Statewide",
        phone: "2-1-1 or (866) 813-1731",
        website: "211iowa.org",
        description: "Comprehensive referral for basic needs, food, and disaster help. Available in 150+ languages.",
        address: "Statewide",
        city: "Des Moines"
      },
      {
        name: "Your Life Iowa",
        category: "Crisis & Navigation",
        county: "Statewide",
        phone: "(855) 581-8111",
        website: "yourlifeiowa.org",
        description: "Crisis line and system navigation for substance use, mental health, and problem gambling.",
        address: "Statewide",
        city: "Des Moines"
      },
      {
        name: "988 Suicide & Crisis Lifeline",
        category: "Crisis & Navigation",
        county: "Statewide",
        phone: "9-8-8",
        website: "988lifeline.org",
        description: "Immediate support for suicidal thoughts and severe psychological crises.",
        address: "Statewide",
        city: "Nationwide"
      },
      {
        name: "Iowa Compass",
        category: "Disability Services",
        county: "Johnson",
        phone: "(800) 779-2502",
        website: "iowacompass.org",
        description: "Disability-specific information and community support for people with disabilities and complex health needs.",
        address: "100 Hawkins Dr",
        city: "Iowa City"
      },
      {
        name: "Military & Family Helpline",
        category: "Veterans Services",
        county: "Statewide",
        phone: "(866) 813-1731",
        website: "211iowa.org",
        description: "Specialized support for veterans, active duty military, and dependents.",
        address: "Statewide",
        city: "Des Moines"
      },
      {
        name: "Iowa Concern Hotline",
        category: "Legal & Financial",
        county: "Statewide",
        phone: "(800) 447-1985",
        website: "iastate.edu",
        description: "Legal and financial stress hotline for rural residents and farmers facing crisis.",
        address: "Statewide",
        city: "Ames"
      },

      // Behavioral Health Centers
      {
        name: "Abbe Center",
        category: "Behavioral Health",
        county: "Linn",
        phone: "(319) 398-3562",
        website: "abbe.org",
        description: "Community Mental Health Center providing IRSH, PATH outreach, and Supported Community Living services.",
        address: "501 13th St NW",
        city: "Cedar Rapids"
      },
      {
        name: "Broadlawns Community Mental Health Center",
        category: "Behavioral Health",
        county: "Polk",
        phone: "(515) 282-5700",
        website: "broadlawns.org",
        description: "CMHC providing mental health services and supported living for low-income adults.",
        address: "1801 Hickman Rd",
        city: "Des Moines"
      },
      {
        name: "Vera French Mental Health Center",
        category: "Behavioral Health",
        county: "Scott",
        phone: "(563) 322-5276",
        website: "verafrench.org",
        description: "Community Mental Health Center with PATH, Supported Community Living, and crisis services.",
        address: "1441 W Central",
        city: "Davenport"
      },
      {
        name: "Hillcrest Family Services",
        category: "Behavioral Health",
        county: "Dubuque",
        phone: "(563) 582-0145",
        website: "hillcrest-fs.org",
        description: "CMHC providing mental health services for youth and adults, including PATH and SCL.",
        address: "200 Mercy Dr",
        city: "Dubuque"
      },
      {
        name: "Black Hawk Grundy Mental Health Center",
        category: "Behavioral Health",
        county: "Black Hawk",
        phone: "(319) 234-2893",
        website: "bhgmhc.org",
        description: "Multi-county CMHC with PATH services for individuals with severe mental illness.",
        address: "3251 W 9th St",
        city: "Waterloo"
      },

      // SUD Treatment
      {
        name: "ASAC, Inc.",
        category: "Substance Use Treatment",
        county: "Linn",
        phone: "(319) 390-4611",
        website: "asac.us",
        description: "Licensed SUD provider offering MAT, residential treatment, and gambling counseling.",
        address: "3601 16th Ave SW",
        city: "Cedar Rapids"
      },
      {
        name: "Prairie Ridge Addiction Treatment",
        category: "Substance Use Treatment",
        county: "Cerro Gordo",
        phone: "(641) 423-3242",
        website: "prairieridge.net",
        description: "Residential SUD treatment with MAT and gambling services.",
        address: "320 N Eisenhower",
        city: "Mason City"
      },
      {
        name: "Allen Recovery Center",
        category: "Substance Use Treatment",
        county: "Black Hawk",
        phone: "(319) 235-3550",
        website: "covhlth.org",
        description: "Hospital-based detoxification and MAT services.",
        address: "1825 Logan Ave",
        city: "Waterloo"
      },
      {
        name: "The Abbey Center",
        category: "Substance Use Treatment",
        county: "Scott",
        phone: "(563) 355-4707",
        website: "genesis-health.com",
        description: "Residential substance use treatment with medication-assisted treatment.",
        address: "1401 Central Ave",
        city: "Bettendorf"
      },

      // Housing & Shelter
      {
        name: "Elevate Housing",
        category: "Housing & Shelter",
        county: "Black Hawk",
        phone: "(833) 370-0719",
        website: "elevatehousing.org",
        description: "Permanent Supportive Housing and IRSH services for individuals with SMI and homelessness.",
        address: "1605 Lafayette St",
        city: "Waterloo"
      },
      {
        name: "Candeo Supported Community Living",
        category: "Housing & Shelter",
        county: "Polk",
        phone: "(515) 259-8110",
        website: "candeo.org",
        description: "Supported living services for adults with intellectual disabilities and SMI.",
        address: "9550 Hickman Rd",
        city: "Des Moines"
      },

      // Employment
      {
        name: "IowaWORKS - Des Moines",
        category: "Employment",
        county: "Polk",
        phone: "(515) 281-9619",
        email: "DesMoinesIowaWORKS@iwd.iowa.gov",
        description: "Comprehensive workforce services including Second Chance employment for justice-involved individuals.",
        address: "200 Army Post Rd",
        city: "Des Moines"
      },
      {
        name: "IowaWORKS - Cedar Rapids",
        category: "Employment",
        county: "Linn",
        phone: "(319) 365-9474",
        email: "CedarRapidsIowaWORKS@iwd.iowa.gov",
        description: "Career counseling, job training, and unemployment assistance.",
        address: "1025 Kirkwood Pkwy",
        city: "Cedar Rapids"
      },
      {
        name: "IowaWORKS - Waterloo",
        category: "Employment",
        county: "Black Hawk",
        phone: "(319) 235-2123",
        email: "WaterlooIowaWORKS@iwd.iowa.gov",
        description: "Employment services for Black Hawk, Butler, and Grundy counties.",
        address: "3420 University Ave",
        city: "Waterloo"
      },
      {
        name: "IowaWORKS - Sioux City",
        category: "Employment",
        county: "Woodbury",
        phone: "(712) 233-9030",
        email: "SiouxCityIowaWORKS@iwd.iowa.gov",
        description: "Workforce development for NW Iowa region.",
        address: "2508 4th St",
        city: "Sioux City"
      },

      // Legal Aid
      {
        name: "Iowa Legal Aid - Des Moines",
        category: "Legal Services",
        county: "Polk",
        phone: "(800) 532-1275",
        website: "iowalegalaid.org",
        description: "Free civil legal services for low-income Iowans including housing, debt, and expungement.",
        address: "666 Walnut St, 25th Fl",
        city: "Des Moines"
      },
      {
        name: "Iowa Legal Aid - Cedar Rapids",
        category: "Legal Services",
        county: "Linn",
        phone: "(800) 532-1275",
        website: "iowalegalaid.org",
        description: "Regional legal aid for family law, taxes, and veteran issues.",
        address: "317 7th Ave SE",
        city: "Cedar Rapids"
      },
      {
        name: "Legal Hotline for Older Iowans",
        category: "Legal Services",
        county: "Statewide",
        phone: "(800) 992-8161",
        website: "iowaseniorlegalhotline.org",
        description: "Free legal advice for Iowans aged 60+ on issues like elder abuse and long-term care.",
        address: "666 Walnut St",
        city: "Des Moines"
      },
      {
        name: "Disability Rights Iowa",
        category: "Legal Services",
        county: "Polk",
        phone: "(515) 278-2502",
        website: "disabilityrightsiowa.org",
        description: "Advocacy for people with disabilities, ADA violations, and disability law.",
        address: "666 Walnut St",
        city: "Des Moines"
      },

      // Food Banks
      {
        name: "Food Bank of Iowa",
        category: "Food & Nutrition",
        county: "Polk",
        phone: "(515) 564-0330",
        website: "foodbankiowa.org",
        description: "Regional food bank serving 55 central and SE Iowa counties.",
        address: "2220 E 17th St",
        city: "Des Moines"
      },
      {
        name: "Northeast Iowa Food Bank",
        category: "Food & Nutrition",
        county: "Black Hawk",
        phone: "(319) 235-0507",
        website: "northeastiowafoodbank.org",
        description: "Serving 16 NE Iowa counties with food distribution and mobile pantries.",
        address: "1605 Lafayette St",
        city: "Waterloo"
      },
      {
        name: "River Bend Food Bank",
        category: "Food & Nutrition",
        county: "Scott",
        phone: "(563) 345-6490",
        website: "riverbendfoodbank.org",
        description: "Food bank serving 22 counties in Iowa and Illinois.",
        address: "4010 Kimmel Dr",
        city: "Davenport"
      },
      {
        name: "Food Bank of Siouxland",
        category: "Food & Nutrition",
        county: "Woodbury",
        phone: "(712) 255-9741",
        website: "foodbankofsiouxland.org",
        description: "Serving 11 NW Iowa counties with food assistance programs.",
        address: "1313 11th St",
        city: "Sioux City"
      },

      // Healthcare
      {
        name: "Primary Health Care, Inc.",
        category: "Healthcare",
        county: "Polk",
        phone: "(515) 225-7201",
        website: "phciowa.org",
        description: "Federally Qualified Health Center providing primary care, dental, and behavioral health on sliding fee scale.",
        address: "7555 Hickman Rd",
        city: "Urbandale"
      },
      {
        name: "Community Health Care of Southern Iowa",
        category: "Healthcare",
        county: "Appanoose",
        phone: "(641) 446-2383",
        website: "chcsi.org",
        description: "FQHC providing comprehensive primary care services.",
        address: "211 East State St",
        city: "Centerville"
      },

      // Transportation
      {
        name: "DART (Des Moines Area Regional Transit)",
        category: "Transportation",
        county: "Polk",
        phone: "(515) 283-8100",
        website: "ridedart.com",
        description: "Public transportation for Des Moines metro area.",
        address: "620 Cherry St",
        city: "Des Moines"
      },
      {
        name: "OnBoard Public Transit",
        category: "Transportation",
        county: "Black Hawk",
        phone: "(319) 235-0311",
        website: "cfrtransit.org",
        description: "Regional transit for Black Hawk, Bremer, and Grundy counties.",
        address: "200 Washington St",
        city: "Waterloo"
      },
      {
        name: "CorridorRides",
        category: "Transportation",
        county: "Linn",
        phone: "(319) 365-9941",
        website: "corridorrides.org",
        description: "Regional transportation for Linn, Johnson, and Benton counties.",
        address: "700 4th Ave SW",
        city: "Cedar Rapids"
      }
    ];

    // Bulk create resources
    const results = await base44.asServiceRole.entities.Resource.bulkCreate(iowaResources);

    return Response.json({ 
      success: true, 
      message: `Successfully imported ${results.length} Iowa resources`,
      count: results.length 
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});