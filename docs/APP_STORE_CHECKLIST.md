# App Store Compliance Checklist

Check these off before submitting to either store. Current as of mid-2026 —
guidelines change, so skim the official pages again before your actual
submission.

## Both stores
- [ ] Public privacy policy URL, even though we collect no data off-device
      (both stores require this regardless of what you collect)
- [ ] App icon in all required sizes
- [ ] Screenshots for each required device size
- [ ] No placeholder text, broken links, or crash-prone screens anywhere
- [ ] Notification permission is explicitly requested, never assumed
- [ ] App works with no internet connection (since we're local-storage-only)

## iOS / App Store Connect
- [ ] Apple Developer Program enrollment ($99/yr)
- [ ] App Privacy "Nutrition Label" filled out accurately in App Store Connect
      — since v1 stores data locally only, this should mostly be "no data
      collected"
- [ ] If we ever add accounts: in-app account deletion becomes mandatory
      (Guideline 5.1.1)
- [ ] Tested via TestFlight before submitting for review
- [ ] Follows Human Interface Guidelines for navigation/gestures

## Android / Google Play Console
- [ ] Google Play Developer account ($25 one-time)
- [ ] "Data Safety" section filled out accurately
- [ ] Closed testing period with enough testers completed (Google requires
      this for new developer accounts before you can go to production)
- [ ] Target API level meets Google Play's current minimum requirement
      (check at submission time — this minimum increases yearly)
- [ ] Follows Material Design patterns where reasonable

## Revisit if we add accounts / cloud sync later
- [ ] In-app account deletion flow (Apple requires this, Google expects it too)
- [ ] Update privacy policy and both stores' data disclosures to reflect
      what's now leaving the device
- [ ] Data retention/deletion policy documented
