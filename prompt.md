# Leads 

## 1. Decrease the selection button  on the left from 2 columns to 1 column. 
## 2. Seperate 'Contact' column into 2 column: 'Phone_Number' and 'Email'. 
## 3. Discard the inner scrollbar, only use browser scrollbar. 
## 4. Seperate 'address' column into 3 column: 'Detail_Address' which is end at city name, 'State_Abbreviation' and 'Postcode'.

# Collections

## 1. Fail to load leads in collection, but records stored to Supabase successfully: 

- Data is stored to collections and collection_items successfully.
- Error fetching collection items: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column collection_items.created_at does not exist'
  }

# Campaigns

## 1. Duplicated 'Create new campaign' button. 

## 2. Failed to create campaigns: 

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