#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# LIGHTHOUSE GOOGLE CLOUD RUN & FIREBASE DEPLOYMENT SCRIPT
# ==============================================================================

echo "============================================================"
echo "Starting Lighthouse Cloud Deployment Pre-flight Checks"
echo "============================================================"

# 1. Verify Project Environment Variables
if [ -z "${GOOGLE_CLOUD_PROJECT:-}" ]; then
  echo "ERROR: GOOGLE_CLOUD_PROJECT environment variable is required."
  exit 1
fi

export FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-$GOOGLE_CLOUD_PROJECT}"
if [ "$FIREBASE_PROJECT_ID" != "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "ERROR: FIREBASE_PROJECT_ID must match GOOGLE_CLOUD_PROJECT for unified identity & Firestore isolation."
  exit 1
fi

export REGION="${REGION:-asia-south1}"

# 2. Check Public Firebase Web Configuration
if [ -z "${FIREBASE_WEB_API_KEY:-}" ] || [ -z "${FIREBASE_AUTH_DOMAIN:-}" ] || [ -z "${FIREBASE_APP_ID:-}" ]; then
  echo "ERROR: Public Firebase configuration missing. Please export FIREBASE_WEB_API_KEY, FIREBASE_AUTH_DOMAIN, and FIREBASE_APP_ID."
  exit 1
fi

echo "Deploying to Google Cloud Project: $GOOGLE_CLOUD_PROJECT"
echo "Region: $REGION"

# 3. Enable Required Google Cloud APIs
echo "--> Enabling required Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  --project="$GOOGLE_CLOUD_PROJECT"

# 4. Verify Secret Manager Secret Exists with an Enabled Version
echo "--> Verifying Secret Manager secret 'lighthouse-gemini-api-key'..."
if ! gcloud secrets describe lighthouse-gemini-api-key --project="$GOOGLE_CLOUD_PROJECT" > /dev/null 2>&1; then
  echo "ERROR: Secret 'lighthouse-gemini-api-key' does not exist in Secret Manager."
  echo "Please create it directly in Google Cloud Console or via gcloud secrets create."
  exit 1
fi

SECRET_STATE=$(gcloud secrets versions list lighthouse-gemini-api-key --project="$GOOGLE_CLOUD_PROJECT" --filter="state=ENABLED" --format="value(name)" --limit=1)
if [ -z "$SECRET_STATE" ]; then
  echo "ERROR: No ENABLED version found for secret 'lighthouse-gemini-api-key'."
  exit 1
fi
echo "✓ Secret verified with active enabled version."

# 5. Create Dedicated Runtime Service Account
SA_NAME="lighthouse-runtime"
SA_EMAIL="${SA_NAME}@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"

echo "--> Checking dedicated Cloud Run runtime service account ($SA_EMAIL)..."
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$GOOGLE_CLOUD_PROJECT" > /dev/null 2>&1; then
  echo "Creating service account $SA_NAME..."
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Lighthouse Cloud Run Runtime Service Account" \
    --project="$GOOGLE_CLOUD_PROJECT"
fi

# 6. Grant Least-Privilege IAM Roles
echo "--> Granting least-privilege roles to runtime service account..."
# Firestore Application User
gcloud projects add-iam-policy-binding "$GOOGLE_CLOUD_PROJECT" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/datastore.user" \
  --condition=None > /dev/null

# Secret Manager Accessor on the specific secret only
gcloud secrets add-iam-policy-binding lighthouse-gemini-api-key \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project="$GOOGLE_CLOUD_PROJECT" > /dev/null

# 7. Deploy Deny-All Firestore Rules First
echo "--> Deploying Firestore security rules (default deny direct client access)..."
if command -v firebase > /dev/null 2>&1; then
  firebase deploy --only firestore:rules --project="$GOOGLE_CLOUD_PROJECT"
else
  npx firebase-tools deploy --only firestore:rules --project="$GOOGLE_CLOUD_PROJECT"
fi
echo "✓ Firestore security rules deployed successfully."

# 8. Deploy Cloud Run Service
echo "--> Deploying Lighthouse container to Google Cloud Run..."
gcloud run deploy lighthouse \
  --source=. \
  --project="$GOOGLE_CLOUD_PROJECT" \
  --region="$REGION" \
  --service-account="$SA_EMAIL" \
  --set-secrets="GEMINI_API_KEY=lighthouse-gemini-api-key:latest" \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_WEB_API_KEY=$FIREBASE_WEB_API_KEY,FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN,FIREBASE_APP_ID=$FIREBASE_APP_ID" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --allow-unauthenticated

echo "============================================================"
echo "✓ Lighthouse Cloud Run deployment completed successfully!"
echo "Remember to add your Cloud Run domain to Firebase Auth Authorized Domains."
echo "============================================================"
