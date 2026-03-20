import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// This file router powers the UploadThing upload endpoints for this app.
// Endpoint slug(s) must match what you use in the client UploadButton.
export const ourFileRouter = {
  licenseUploader: f({
    // Allow any file type for both license uploads and chat attachments.
    blob: { maxFileSize: "16MB", maxFileCount: 1 },
  }).onUploadComplete(() => {
    // Client-side callbacks receive upload URLs regardless of serverdata.
    return {};
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

