# responsive designing


# Leads

## 1. ✅ Decrease the selection button from 2 columns to 1 column. H

## 2. ✅ Seperate 'Contact' column into 2 column: 'Phone_Number' and 'Email'. H

## 3. ✅ Discard the inner scrollbar, only use browser scrollbar. H

## 4. Name search improvement:L

- results are messy, it should add sorting algorithm.

## 5. Address search improvement:L

- it should accept abbreviation and postcode searching.

## 6. Actions column business logic:H

- User clicks "Save" → Opens modal → User selects/creates a collection → Lead is added, it should be merged to table filter, column should just output the collection name which lead belongs to.

## 7 Research how to display multi-column table vertically M

## 8. Database column analysis:

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

## ✅ 9. Select leads from different pages: refer to react: redux, not save if jump to other pages (collections, compaigns, etc.). H

## 10. Add a drop box to adjust the number of rows in each page of the list. L

# Collections

## ✅ 1. Fail to load leads in collection: H

- Data is stored to collections and collection_items successfully.
- Error fetching collection items: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column collection_items.created_at does not exist'
  }

## 2. Edit collection information: L

- it should allow users to modify collection name, and add or delete leads in this collection.

## 3. Refine collection list display layout M

# Campaigns

## ✅ 1. Duplicated 'Create new campaign' button. H

## 2. Failed to create campaigns: H

- 1. analyse error logs, check api code.
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


## Email Generation Error:
Starting email generation for campaign 2
DrizzleQueryError: Failed query: select "id", "organization_id", "name", "subject", "sender_name", "sender_email", "service_description", "tone", "status", "total_recipients", "sent_count", "generated_count", "failed_count", "target_list_id", "created_at", "updated_at" from "campaigns" where ("campaigns"."id" = $1 and "campaigns"."organization_id" = $2) limit $3
params: 2,org_38HGXMk1WUEWxO4aQHf4cBQoROO

