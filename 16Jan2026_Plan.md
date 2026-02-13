# vercel domains: https://ai-email-marketing.vercel.app/

# responsive designing

# Leads
 
## 1. ✅ Decrease the selection button from 2 columns to 1 column. H

## 2. ✅ Seperate 'Contact' column into 2 column: 'Phone_Number' and 'Email'. H

## 3. ✅ Discard the inner scrollbar, only use browser scrollbar. H

## 4. Name search improvement:L

- results are messy, it should add sorting algorithm.

## 5. Address search improvement:L

- it should accept abbreviation and postcode searching.

## 6. ✅ Actions column business logic:H

- User clicks "Save" → Opens modal → User selects/creates a collection → Lead is added, it should be merged to table filter, column should just output the collection name which lead belongs to.

## 7 Research how to display multi-column table vertically M

## 8. ✅ Database column analysis:

| Group                  | Column Name         | Function / Purpose                                                                   |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| 1. Identification     | 0record_id           | Internal unique identifier for the database record (primary key).                    |
| 1. Identification     | 0listing_id          | Platform-wide or external identifier used across systems and APIs.                   |
| 1. Identification     | 0listing_type        | Defines the type of listing (e.g. Business, Service, Franchise).                     |
| 2. Business Identity | 1company_name       | Registered or trading name of the business.                                          |
| 2. Business Identity   | 2date_established   | Year the business was founded; used for credibility and experience filters.          |
| 2. Business Identity   | 2employees_count    | Approximate size of the business (used for trust signals and filtering).             |
| 3. Contact Info        | 1phone_number       | Primary customer contact phone number.                                               |
| 3. Contact Info        | 1email              | Business contact email for enquiries or support.                                     |
| 3. Contact Info        | 2website_url        | Official business website URL.                                                       |
| 4. Location            | 1address_suburb     | Suburb where the business is located.                                                |
| 4. Location            | 1address_state      | State or territory (e.g. NSW).                                                       |
| 4. Location            | 2address_postcode   | Postal code for regional filtering and addressing.                                   |
| 4. Location            | 0latitude           | Latitude coordinate used for maps and distance calculations.                         |
| 4. Location            | 0longitude          | Longitude coordinate used for maps and distance calculations.                        |
| 5. Legal               | 2abn                | Australian Business Number for legal verification.                                   |
| 5. Legal               | 2acn                | Australian Company Number (for incorporated companies only).                         |
| 6. Categorisation      | 0category_id        | Internal numeric identifier for the service category.                                |
| 6. Categorisation      | ?category_name      | Human-readable category name shown to users.                                         |
| 6. Categorisation      | 0industry_id        | Internal identifier for the broader industry classification.                         |
| 6. Categorisation      | ?industry_name      | Industry grouping used for navigation and filtering.                                 |
| 7. Description         | 2description_short  | Short marketing tagline or headline for previews and cards.                          |
| 7. Description         | 0description (JSON) | Structured rich content containing short, medium, long descriptions and HTML blocks. |
| 7. Description         | 2service_notes      | Operating hours, appointment rules, or service limitations.                          |
| 8. Marketing           | 2selling_points     | Key value propositions displayed as bullet highlights.                               |
| 8. Marketing           | 2keywords_list      | SEO and search indexing keywords to improve discoverability.                         |
| 9. Data Management     | 0last_updated       | Timestamp of the most recent update to the record.                                   |

## 9. ✅ Select leads from different pages: refer to react: redux, not save if jump to other pages (collections, compaigns, etc.). H

## 10. Add a drop box to adjust the number of rows in each page of the list. L

## 11. Automatically jump to Collections page after 'save to collection' M

## 12. ✅ Delete the black background after click on save to collection. H


## 14. ✅ Update industry filter data, now there are missing industry_name from rawdata_yellowpage table. H
 - compare the number of category_name and industry_name.
 - new column, summary of current filter: maxmum: 15

## 15. Update city name auto complete. M

## 16. Add state name selector between city input and filter. L

## 17. Categories: increase to 39 categories. H

## 18. Table display errors, each element should be at central of each row. EH

# Collections

## 1. ✅ Fail to load leads in collection: H

- Data is stored to collections and collection_items successfully.
- Error fetching collection items: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column collection_items.created_at does not exist'
  }

## 2. Edit collection information: L

- it should allow users to modify collection name, and add or delete leads in this collection.

## 3. Refine collection list display layout L

## 4. ✅ Update the layout of each collections, match to Leads page. H

# Campaigns

## 1. ✅ Duplicated 'Create new campaign' button. H

## 2. ✅ Failed to create campaigns: H

- analyse error logs, check api code.
- campaigns table is empty.
- Using effective org ID: org_38HGXMk1WUEWxO4aQHf4cBQoROO
  Campaign creation request body: {
  "name": "Test Campaign",
  "serviceDescription": "test testtesttesttesttesttesttesttest",
  "emailTone": "friendly",
  "businessIds": [
  "1000002328912",
  "12264281",
  "15000594",
  "14969641",
  "13131483",
  "13659709",
  "15017705",
  "12659042"
  ],
  "collectionId": 2
  }
  Campaign validation failed: {
  \_errors: [],
  businessIds: {
  '0': { \_errors: [Array] },
  '1': { \_errors: [Array] },
  '2': { \_errors: [Array] },
  '3': { \_errors: [Array] },
  '4': { \_errors: [Array] },
  '5': { \_errors: [Array] },
  '6': { \_errors: [Array] },
  '7': { \_errors: [Array] },
  \_errors: []
  }
  }

## 3. Improve the layout: table component L

## 4. ✅ Replace API of generating eamil. H 3

## 5. ✅ Delete inner side scrollbar, and set Scrollbar in create campaign to Google browser scrollbar. H1

## 6. ✅ Delete the pop-up window after select Recipients. H 2

## 7. ✅ Update structure of JSON file send to Resend, correct subject of email. H4

## 8. ✅ Refresh the page after email is generated automatically. H3

## 9. ✅ Email Generation Error: transfer argument [Your Name], [Your Company] making paragraph. H5

## 10. ✅ Multiple select at Recipients involve both collections and individuals  (manually input email) H4

## 11. ✅ Check the interval code snippet in src\app\(dashboard)\campaigns\[id]\page.tsx L

## 12. ✅ Fix bug: signature Your Company is wrong, should match with input Campaign Name. H1

## 13. ✅ Push to Vercel server by MCP.  H2

## 15. ✅ Save inputs before email generation. M

## 16. ✅ Find out the meaning of Total Prospects. H
       - A: how many businesses or contacts will receive emails from this campaign.

## 18. ✅ Display email content as normal HTML format in email preview. H

## 19. ✅ Fix bug at manually add recipients email address. H

## 20. ✅ Merge 2 components into a long component, delete total respects, fix the error at process bar. H

## 21. Check the content of each email is legal or not before sending, sensetive content alert. M

## 22. ✅ Dual-purpose Progress Bar on Campaign Page, create new Email generation progress bar, envoke existing components. H

## 23. Delete 3 card components: Recent Activity, Open Rate, and Click Rate. H

# Senders

## 1 ✅ Repalce action menu to 2 buttons element, 'Verify' and 'Delete' for each row of table. H

## 2. ✅ Set default sender for all new users. H

# Settings 

## 1. ✅ Research Multi-tenant user domain solution. H
      - AWS SES
## 2. ✅ Verify domain name on Resend. H

# Entire Website

## 1. Check the layout colour of drop down box. M

## 2. Check the bugs at vercel deployments between my account and company's account. M

## 3. ✅ Change the domain name of email sending. H

## 4. ✅ Manually try the work flow of AWS SES. H

## Implementation of multi-tenant email sending by AWS SES, 4 stages in total: 
 - 1. ✅ Allow user to input required DNS details. H
    1.1 At the bottom side of analyse, create a new page which is Domains.
    1.2 Similar to Resend
    1.3 Onboarding flow : 
      1.3.1 Header: Which email address you prefer to use?
      1.3.2: Email address with a input element.
      1.3.3: Add Sender, button element
      1.3.4: get TXT values from AWS SES, display at DNS records 
 - 2. ✅ Verification of users' inputs. H
 - 3. Sending emails via AWS SES. H
 - 4. ✅ User management, such as restriction of adding domain names for free users. M

 # 12FEB2026 
 ## 1. ✅ Replace 'Your company' (Email From Header) to 'Campaign Name'. H
 ## 2. Replace email sending API from Resend to AWS SES. H


